# graph-by-ivan-tulaev
Graph library for traversing and processing any directional graphs.

## Description
 - Working with **direction graphs**.
 - Has utility functions for **elements CRUD** operations (nodes & edges)
 - Customise graph traversing with **genericTraversing**
 - Get independent sub-graphs with **getSeparatedGraphs**
 - Check if there is a path between two nodes in different directions with **isNodeTraced**
 - Has some popular functions for customisation traversing in [traversingFunctions](lib/traversingFunctions)

## Traverse customisation
Use **genericTraversing** in [Graph class](lib/Graph.ts) for create your own graph traversing algorithm.

### callbacks
 - **getStartElement: (visited: Set<N>, initialGraph: Graph<N>) => N | undefined**
   - get node to start or repeat iteration after executionSequence is empty
   - stop iteration when undefined
 - **getNextFromExecutionSequence: (executionSequence: Array<N>) => N | undefined**
   - get next elements from executionSequence
   - in some cases it is best way to use .pop()... in some cases .shift()
 - **getNextNodes: (node: N, graph: Graph<N>, visited: Set<N>) => Array<N> | undefined**
   - for get next nodes
   - these can be outgoing, incoming or other specific nodes
   - stop iteration when undefined
 - **addNextNodesToExecutionSequence: (nodes: Array<N>, executionSequence: Array<N>) => void**
   - add nodes to executionSequence
   - in some cases it is best way to use .push()... in some cases .unshift()
 - **executeCurrent?: (node: N) => void**
   - for current node processing

### examples
For callbacks examples you can check **getSeparatedGraphs()** and **isNodeTraced()** in [Graph class](lib/Graph.ts)


## License
[MIT](./LICENSE)