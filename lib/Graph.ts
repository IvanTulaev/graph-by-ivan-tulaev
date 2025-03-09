interface IEdge<N> {
    source: N
    target: N
}

type GetStartElementFunction<N> = (visited: Set<N>, initialGraph: Graph<N>) => N | undefined
type GetNextFromExecutionSequence<N> = (executionSequence: Array<N>) => N | undefined
type ExecuteCurrentFunction<N> = (node: N) => void
type GetNextNodesFunction<N> = (node: N, graph: Graph<N>, visited: Set<N>) => Array<N> | undefined
type AddNextNodesToExecutionSequence<N> = (nodes: Array<N>, executionSequence: Array<N>) => void;

interface IAdjacencyValueElement<N>{
    incoming: Set<IEdge<N>>, outgoing: Set<IEdge<N>>
}

export class Graph<N> {

    notDirected: boolean
    private _adjacencyList: Map<N, IAdjacencyValueElement<N>>

    constructor(notDirected: boolean) {
        this.notDirected = notDirected
        this._adjacencyList = new Map<N, IAdjacencyValueElement<N>>()
    }

    get nodes () {
        return [...this._adjacencyList.keys()];
    }

    addNode(node: N) {
        if (!this.nodes.includes(node)) {
            this._adjacencyList.set(node, {incoming: new Set<IEdge<N>>(), outgoing: new Set<IEdge<N>>()});
        }
    }

    deleteNode(node: N) {
        this._adjacencyList.delete(node);

        for (const [, value] of this._adjacencyList) {
            const {incoming, outgoing} = value
            const allEdges = new Set ([...incoming, ...outgoing])

            for (const edge of allEdges) {
                if (edge.source !== node && edge.source !== node) continue;
                incoming.delete(edge)
                outgoing.delete(edge)
            }
        }
    }

    get edges() {
        return new Set ([...this._adjacencyList.values()]
            .map(item => [...item.incoming, ...item.outgoing])
            .flat());
    }

    addEdge(edge: IEdge<N>){
        const {source, target} = edge

        if (!this._adjacencyList.has(source) || !this._adjacencyList.has(target)) throw new Error(`Cannot add adjacency: has no node ${source} or ${target}`)

        // add to incoming
        const incoming = this._adjacencyList.get(target)
        if (incoming) {
            incoming.incoming.add(edge)
        }

        // add to outgoing
        const outgoing = this._adjacencyList.get(source)
        if (outgoing) {
            outgoing.outgoing.add(edge)
        }
    }

    deleteEdge(edge: IEdge<N>){
        const {source, target} = edge

        // remove from incoming
        const incoming = this._adjacencyList.get(target)
        if (incoming) {
            incoming.incoming.delete(edge)
        }

        // remove from outgoing
        const outgoing = this._adjacencyList.get(source)
        if (outgoing) {
            outgoing.outgoing.delete(edge)
        }
    }

    getIncomingEdgesFor(node: N) {
        return this._adjacencyList.get(node)?.incoming || new Set<IEdge<N>>()
    }

    getOutgoingEdgesFor(node: N) {
        return this._adjacencyList.get(node)?.outgoing || new Set<IEdge<N>>()
    }

    /**
     * @param getStartElement
     * @param getNextFromExecutionSequence
     * @param getNextNodes will be sorted
     * @param addNextNodesToExecutionSequence
     * @param executeCurrent
     // * @param sortNextElements
     // * @param getStopCondition
     */
    genericTraversing(
        getStartElement: GetStartElementFunction<N>,
        getNextFromExecutionSequence: GetNextFromExecutionSequence<N>,
        getNextNodes: GetNextNodesFunction<N>,
        addNextNodesToExecutionSequence: AddNextNodesToExecutionSequence<N>,
        executeCurrent?: ExecuteCurrentFunction<N>,
    ) {

        const visited = new Set<N>()

        while (visited.size < this.nodes.length) {

            // undefined next start will be stop iteration
            // const nextStart = getStartElement ?
            //     getStartElement(visited, this) :
            //     this._defaultGetStartElement(visited);
            const nextStart = getStartElement(visited, this)

            // end traversal if no nextNode
            if (!nextStart) break;

            // stack or queue
            const executionSequence: Array<N> = [nextStart]

            while (executionSequence.length > 0) {

                // const currentNode = getNextFromExecutionSequence ?
                //     getNextFromExecutionSequence(executionSequence) :
                //     this._defaultGetNextFromExecutionSequence(executionSequence)
                const currentNode = getNextFromExecutionSequence(executionSequence)

                if (!currentNode) throw new Error(`Can't get current node from ${executionSequence}`)

                // execute currentNode
                visited.add(currentNode)
                if (executeCurrent) executeCurrent(currentNode)

                // get nodes for next iteration
                // TODO: need stop iteration: example for traverse check
                // const nextNodes = getNextNodes ?
                //     getNextNodes(currentNode, this, visited) :
                //     this._defaultGetNextNodes(currentNode)
                const nextNodes = getNextNodes(currentNode, this, visited)

                //stop iteration if nextNodes === undefined
                // TODO: stop two levels of iteration!
                if (!nextNodes) break;

                // if (addNextNodesToExecutionSequence) {
                //     addNextNodesToExecutionSequence(nextNodes, executionSequence)
                // }else {
                //     this._defaultAddNextNodesToExecutionSequence(nextNodes, executionSequence)
                // }

                addNextNodesToExecutionSequence(nextNodes, executionSequence)

            }
        }
    }

    // TODO: ADD OPTIMISATION
    getSeparatedGraphs(){
        const separatedGraphs = new Set<Graph<N>>()
        // const localVisited = new Set<N>()

        const getRandomStart = (visited: Set<N>, initialGraph: Graph<N>) => {
            return initialGraph.nodes.find(item => !visited.has(item))
        }

        const getFirstFromExecutionSequence = (executionSequence: Array<N>) => {
            return executionSequence.pop()
        }

        const getAllNotVisitedAdjacentNodes = (node: N, graph: Graph<N>, visited: Set<N>) => {

            const outgoingEdges = graph.getOutgoingEdgesFor(node)
            const outgoingNodes = [...outgoingEdges].map(edge => edge.target)
            const incomingEdges = graph.getIncomingEdgesFor(node)
            const incomingNodes = [...incomingEdges].map(edge => edge.source)

            const allEdges = new Set([...outgoingEdges,...incomingEdges])
            const allNodes = new Set([...outgoingNodes,...incomingNodes])

            const localGraph = new Graph<N>(false)
            localGraph.addNode(node)

            for (const localNode of allNodes) {
                localGraph.addNode(localNode)
            }

            for (const localEdge of allEdges) {
                localGraph.addEdge(localEdge)
            }

            // проверяем есть ли пересечение по вершинам с графами в separatedGraphs
            // Обработка тех что уже ест в графах
            const graphsToMerge = new Set<Graph<N>>()
            // check in separatedGraphs
            for (const localNode of localGraph.nodes) {
                for (const separatedGraph of separatedGraphs) {
                    // TODO: ПРОРАБОТАТЬ МЕРЖ
                    if (separatedGraph.nodes.includes(localNode)) {
                        graphsToMerge.add(separatedGraph)
                        break
                    }
                }
            }

            if (graphsToMerge.size > 0) {
                for (const graphToMerge of graphsToMerge) {
                    separatedGraphs.delete(graphToMerge)
                }
                const mergedGraphs = Graph.mergeGraphs(graphsToMerge.add(localGraph))
                separatedGraphs.add(mergedGraphs)
            } else {
                separatedGraphs.add(localGraph)
            }

            return [...allNodes].filter(item => !visited.has(item))

        }

        const pushToExecution = (nodes: Array<N>, executionSequence: Array<N>) => {
            for (const node of nodes) {
                executionSequence.push(node)
            }
        }

        this.genericTraversing(getRandomStart, getFirstFromExecutionSequence, getAllNotVisitedAdjacentNodes, pushToExecution )

        return [...separatedGraphs]
    }

    static mergeGraphs<N>(graphs: Set<Graph<N>>){
        const resultGraph = new Graph<N>(false)

        for (const graph of graphs) {
            for (const node of graph.nodes) {
                resultGraph.addNode(node)
            }

            for (const edge of graph.edges) {
                resultGraph.addEdge(edge)
            }
        }

        return resultGraph
    }

    // TODO: It's a merge
    static initFromGraph<N>(graph: Graph<N>) {
        const newGraph = new Graph<N>(false)
        for (const node of graph.nodes) {
            newGraph.addNode(node)
        }
        for (const edge of graph.edges) {
            newGraph.addEdge(edge)
        }
        return newGraph
    }

    // //  GetStartElementFunction<N>
    // _defaultGetStartElement(visited: Set<N>) {
    //     return this.nodes.find(item => !visited.has(item))
    // }
    //
    // // GetNextFromExecutionSequence
    // _defaultGetNextFromExecutionSequence(executionSequence: Array<N>){
    //     return executionSequence.pop()
    // }
    //
    // _defaultGetNextNodes(node: N) {
    //     return [...this.getOutgoingEdgesFor(node)].map(edge => edge.target)
    // }
    //
    // _defaultAddNextNodesToExecutionSequence(nodes: Array<N>, executionSequence: Array<N>) {
    //     // default is DFS with all elements
    //     executionSequence.splice(executionSequence.length, 0, ...nodes)
    // }

}