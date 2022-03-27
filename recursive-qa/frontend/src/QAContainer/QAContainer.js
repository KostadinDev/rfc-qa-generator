import React, {useState, useEffect, useReducer} from 'react';
import QAItems from "./QAItems";
import QACard from "./QACard";
import './qacontainer.style.css';
import NextButton from "./NextButton";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Instructions from "./Instructions";
import SubmitButton from "./SubmitButton";
import FlagButton from "./FlagButton";
import RemoveButton from "./RemoveButton";
import SkipButton from "./SkipButton";

class Segment {
    constructor(text, template, startingIndex, parent) {
        this.text = text;
        this.type = null;
        this.children = [];
        this.relation = null;
        this.startingIndex = startingIndex;
        this.endingIndex = startingIndex + text.length;
        this.parent = parent;
        this.template = template;
    }
}

class Relation {
    constructor(qnode, anode, type) {
        this.qnode = qnode;
        this.anode = anode;
        this.type = type;
    }
}

class Tree {
    constructor(root) {
        this.root = root;
        this.ordering = [root];
    }

    get current() {
        return this.ordering.length ? this.ordering[0] : null;
    }
    get annotation() {
        let serializeNode = (node, serializedChildren) => {
            return {
                "text" : node.text,
                "type" : node.type,
                "children" : serializedChildren,
                "relation" : node.relation?node.relation.type:null,
                "startingIndex" : node.startingIndex,
                "endingIndex" : node.endingIndex,
                "template" : node.template,
            }
        }
        let traverseTree = (node) => {
            let children = [];
            if (node.children) {
                for (let i = 0; i < node.children.length; i++) {
                    children.push(traverseTree(node.children[i]));
                }
            }
            return serializeNode(node, children);
        }
        return traverseTree(this.root); //JSON.stringify(traverseTree(this.root));
    }
    pop() {
        return this.ordering.shift();
    }

    insert(children) {
        this.ordering = children.concat(this.ordering);
    }
}


function QAContainer(props) {
    const [answers, setAnswers] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [tree, setTree] = useState();
    let workingTree;

    const [selectedQuestion, setSelectedQuestion] = useState("");
    const [selectedAnswer, setSelectedAnswer] = useState("");
    const [annotation, setAnnotation] = useState([]);
    const api = "http://localhost:5050";

    const submitRecord = async () => {

        // console.log(tree);

        if (props.scheduled && props.scheduled[0]) {
            const d = new Date();
            const options = {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    history: props.history,
                    // rapid: props.mode,
                    annotation: tree.annotation,
                    record: props.scheduled[0].id,
                    date: d.getTime(),
                })
            };
            await fetch('http://localhost:5050/submit', options)
                .then(async response => {
                    if (!response.ok) {
                        return Promise.reject(response.status);
                    }
                }).catch(error => {
                    alert(error);
                });
            if (props.user) {
                await props.fetchRecords(props.user);
                props.scheduled.shift();
                props.setScheduled(props.scheduled);
                await onMount();
            }
        }
    }
    const removeRecord = async () => {
        if (props.scheduled && props.scheduled[0]) {
            const options = {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({records: [props.scheduled[0].id]})
            };
            await fetch('http://localhost:5050/remove', options)
                .then(async response => {
                    if (!response.ok) {
                        return Promise.reject(response.status);
                    }
                }).catch(error => {
                    alert(error);
                });
            if (props.user) {
                await props.fetchRecords(props.user);
                props.scheduled.shift();
                props.setScheduled(props.scheduled);
                await onMount();
            }
        }
    }
    const skipRecord = async () => {

        if (props.scheduled && props.scheduled[0]) {
            const options = {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({record: props.scheduled[0].id})
            };
            await fetch('http://localhost:5050/skip', options)
                .then(async response => {
                    if (!response.ok) {
                        return Promise.reject(response.status);
                    }
                }).catch(error => {
                    alert("here?");
                });
            if (props.user) {
                await props.fetchRecords(props.user);
                props.scheduled.shift();
                props.setScheduled(props.scheduled);
                await onMount();
            }
        }
    }

    function updateSegments(question, answer) {
        fetch(`${api}/segments?sentence=${question}`).then(res => res.json()).then((result) => {
            return result;
        }, (error) => {
            //TODO handle in case of segment retrieval error
        }).then((newSegments) =>
            fetch(`${api}/segments?sentence=${answer}`).then(res => res.json()).then((result) => {
                newSegments = newSegments.concat(result);
                workingTree = tree
                newSegments = newSegments.map((newSegment) => new Segment(newSegment.segment, newSegment.template, 0, workingTree.current))
                workingTree.current.children = newSegments
                workingTree.current.relation = new Relation(newSegments[0], newSegments[1], null);
                workingTree.pop()
                workingTree.insert(newSegments)
                setTree(workingTree);
                return workingTree;
            }, (error) => {
                alert(error);
            })
        ).then((workingTree) => {
            props.setHistory([{
                'question': question,
                'answer': answer,
                'segment': workingTree.current.parent.text
            }].concat(props.history))
            setQuestions([]);
            setAnswers([]);
            setAnswers([]);
            return workingTree
        }).then((workingTree) => {
            updateQuestions(workingTree.current);
        });
    };

    function updateQuestions(segment) {
        if (segment) {
            fetch(`${api}/questions?segment=${segment['text']}`).then(res => res.json()).then((result) => {
                if (result) {
                    setQuestions(result['questions']);
                }
            }, (error) => {
                alert(error)
            });
        }
    }

    function handleSelectQuestion(chosenQuestion) {
        setSelectedQuestion(chosenQuestion);
        if (tree && tree.current) {
            fetch(`${api}/answers?segment=${tree.current['text']}&question=${chosenQuestion}
            &template=${tree.current['template']}`).then(res => res.json()).then((result) => {
                setAnswers(result['answers']);
            }, (error) => {
                //TODO handle in case of answer retrieval error
            })
        }

    }

    function handleSelectAnswer(chosenAnswer) {
        setSelectedAnswer(chosenAnswer);
        addAnnotation(selectedQuestion, chosenAnswer);
        updateSegments(selectedQuestion, chosenAnswer);

    }

    function getRelation(question, answer) {
        // TODO Implelement this
        return null;
    }

    function addAnnotation(question, answer) {
        // TODO TEST THIS
        const relation = getRelation(question, answer);
        setAnnotation(annotation.concat([[question, answer, relation]]));
    }

    function continueRecord() {
        workingTree = tree;
        if (workingTree) {
            if (workingTree.ordering.length >= 2) {
                workingTree.pop();
                workingTree.pop();
            } else if (workingTree.ordering.length >= 1) {
                workingTree.pop();
            }
            setTree(workingTree);
            setQuestions([]);
            setAnswers([]);
            updateQuestions(workingTree.current);
        }
    }


    const onMount = async () => {
        if (props.scheduled && props.scheduled[0]) {
            setQuestions([]);
            setAnswers([]);
            props.setHistory([])
            let newSegments, newQuestions, root;
            newSegments = await fetch(`${api}/segments?sentence=${props.scheduled[0].sentence}`)
                .then(res => res.json())
                .then((result) => {
                    return result;
                }, (error) => {
                    alert(error);
                });
            root = new Segment(props.scheduled[0].sentence, 0, 0, null);
            workingTree = new Tree(root);

            newSegments = newSegments.map((newSegment) => new Segment(newSegment.segment, newSegment.template, 0, workingTree.current))

            workingTree.current.children = newSegments;
            if (newSegments.length == 2) {
                workingTree.current.relation = new Relation(newSegments[0], newSegments[1], "if_else")
            }
            workingTree.pop();
            workingTree.insert(newSegments)
            await setTree(workingTree);
            updateQuestions(workingTree.current);
        }
    }
    useEffect(() => {
        onMount().catch();
    }, []);


    return (<div className="outside-qacontainer">
            <div className='qasentence'>
                {
                    props.scheduled && props.scheduled[0] && tree ?

                        <QACard scheduled={props.scheduled} sentence={props.scheduled[0]['sentence']}
                                tree={tree}/> : ""
                }
            </div>
            <hr/>
            <button onClick={() => {
                console.log(tree.annotation);
            }}> Button
            </button>
            <div className='qacontainer'>
                <Instructions turnedOn={props.instructions} type='questions'/>
                <QAItems items={questions} setItems={setQuestions} selectedItem={selectedQuestion}
                         handleSelect={handleSelectQuestion} type={"Questions"}/>
                <QAItems items={answers} setItems={setAnswers} selectedItem={selectedAnswer}
                         handleSelect={handleSelectAnswer} type={"Answers"}/>
                <Instructions turnedOn={props.instructions} type='answers'/>
            </div>
            <div className={"qa-button-container"}>
                <div className='qa-buttons'>
                    <div className="qa-button-group">
                        <NextButton handleClick={continueRecord}/>
                        <SubmitButton submitRecord={submitRecord}/>
                    </div>
                    <div className="qa-button-group">
                        <SkipButton skipRecord={skipRecord}/>
                        <FlagButton scheduled={props.scheduled} fetchRecords={props.fetchRecords} user={props.user}/>
                        <RemoveButton removeRecord={removeRecord}/>
                    </div>
                </div>
            </div>
            <hr/>
        </div>
    );
}


export default QAContainer;