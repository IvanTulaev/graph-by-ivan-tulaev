interface IEdge<N> {
    source: N
    target: N
}

type GetStartElementFunction<N> = (visited: Set<N>, initialGraph: Graph<N>) => N | undefined
type GetNextFromExecutionSequence<N> = (executionSequence: Array<N>) => N
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
        this._adjacencyList.set(node, {incoming: new Set<IEdge<N>>(), outgoing: new Set<IEdge<N>>()});
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
     * @param executeCurrent
     * @param getNextNodes will be sorted
     * @param addNextNodesToExecutionSequence
     // * @param sortNextElements
     // * @param getStopCondition
     */
    genericTraversing(
        getStartElement?: GetStartElementFunction<N>,
        getNextFromExecutionSequence?: GetNextFromExecutionSequence<N>,
        executeCurrent?: ExecuteCurrentFunction<N>,
        getNextNodes?: GetNextNodesFunction<N>,
        addNextNodesToExecutionSequence?: AddNextNodesToExecutionSequence<N>,
    ) {

        const visited = new Set<N>()

        while (visited.size < this.nodes.length) {

            // undefined next start will be stop iteration
            const nextStart = getStartElement ?
                getStartElement(visited, this) :
                this._defaultGetStartElement(visited);

            // end traversal if no nextNode
            if (!nextStart) break;

            // stack or queue
            const executionSequence: Array<N> = [nextStart]

            while (executionSequence.length > 0) {

                const currentNode = getNextFromExecutionSequence ?
                    getNextFromExecutionSequence(executionSequence) :
                    this._defaultGetNextFromExecutionSequence(executionSequence)

                if (!currentNode) throw new Error(`Can't get current node from ${executionSequence}`)

                // execute currentNode
                visited.add(currentNode)
                if (executeCurrent) executeCurrent(currentNode)

                // get nodes for next iteration
                // TODO: need stop iteration: example for traverse check
                const nextNodes = getNextNodes ?
                    getNextNodes(currentNode, this, visited) :
                    this._defaultGetNextNodes(currentNode)

                //stop iteration if nextNodes === undefined
                // TODO: stop two levels of iteration!
                if (!nextNodes) break;

                if (addNextNodesToExecutionSequence) {
                    addNextNodesToExecutionSequence(nextNodes, executionSequence)
                }else {
                    this._defaultAddNextNodesToExecutionSequence(nextNodes, executionSequence)
                }
            }
        }
    }

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

    //  GetStartElementFunction<N>
    _defaultGetStartElement(visited: Set<N>) {
        return this.nodes.find(item => !visited.has(item))
    }

    // GetNextFromExecutionSequence
    _defaultGetNextFromExecutionSequence(executionSequence: Array<N>){
        return executionSequence.pop()
    }

    _defaultGetNextNodes(node: N) {
        return [...this.getOutgoingEdgesFor(node)].map(edge => edge.target)
    }

    _defaultAddNextNodesToExecutionSequence(nodes: Array<N>, executionSequence: Array<N>) {
        // default is DFS with all elements
        executionSequence.splice(executionSequence.length, 0, ...nodes)
    }

}