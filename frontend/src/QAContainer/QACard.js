import {Button} from 'react-bootstrap';
import * as React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import {createTheme, ThemeProvider, styled} from '@mui/material/styles';
import Highlighter from 'react-highlight-words';
import './qacontainer.style.css'

const Item = styled(Paper)(({theme}) => ({
    ...theme.typography.body2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: 60,
    lineHeight: '60px',
}));

const darkTheme = createTheme({palette: {mode: 'dark'}});
const elevation = 6;

export default function QACard(props) {
    const sentence = props.sentence;
    const segment = props.segment
    return <div className='qabutton'>
        {/*<div className="d-grid gap-4">*/}
        {/*    <ThemeProvider theme={darkTheme}>*/}
        {/*        <Item key={elevation} elevation={elevation}>*/}
        {/*            <Highlighter*/}
        {/*                highlightClassName="QACard"*/}
        {/*                searchWords={[segment]}*/}
        {/*                autoEscape={true}*/}
        {/*                textToHighlight={sentence}/>*/}
        {/*        </Item>*/}
        {/*    </ThemeProvider>*/}
        {/*</div>*/}
        <Box
            sx={{
                p:4,
                width: '100%',
                border: '1px solid grey', borderRadius: '5px', borderColor:'#5090D3'
            }}
        > <Highlighter
            highlightClassName="highlight"
            searchWords={[segment]}
            autoEscape={true}
            textToHighlight={sentence}/>
        </Box>
        {/*<div className="d-grid gap-4">*/}
        {/*    <ThemeProvider theme={darkTheme}>*/}
        {/*        <Item key={elevation} elevation={elevation}>*/}
        {/*            <Highlighter*/}
        {/*                highlightClassName="QACard"*/}
        {/*                searchWords={[segment]}*/}
        {/*                autoEscape={true}*/}
        {/*                textToHighlight={sentence}/>*/}
        {/*        </Item>*/}
        {/*    </ThemeProvider>*/}
        {/*</div>*/}
    </div>;
}