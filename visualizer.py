

import graphviz
dot = graphviz.Digraph(comment='The Round Table')


dot.node('A', 'King Arthur')
dot.node('B', 'Sir Bedevere the Wise')
dot.node('L', 'Sir Lancelot the Brave')

dot.edges(['AB', 'AL'])
dot.edge('B', 'L', constraint='false')

dot.render('doctest-output/round-table.gv', view=True)



