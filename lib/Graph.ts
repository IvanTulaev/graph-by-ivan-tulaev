interface IEdge<N> {
    source: N
    target: N
}

type GetStartElementFunction<N> = (nodes: Array<N>) => N
type ExecuteCurrentFunction<N> = (node: N) => void
type GetAdjacentElementsFunction<N> = (node: N, graph: Graph<N>) => Array<N>
type SortNextElementsFunction<N> = (nodes: Array<N>) => Array<N>
type GetStopConditionFunction = (...args: any[]) => boolean

// interface INextElements<N> {
//     // for dfs
//     pop: () => N
//     push: (node: N) => number
//
//     // for bfs
//     shift: () => N
//     unshift: (node: N) => number
// }
//
// interface IVisited<N> {
//     has: () => boolean
//     add: (node: N) => Set<N>
//     delete: (node: N) => boolean
// }

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
     * @param isBfs
     * @param getStartElement
     * @param executeCurrent
     * @param getAdjacentElements
     * @param sortNextElements
     * @param getStopCondition
     */
    traversal(
        isBfs: boolean,
        getStartElement?: GetStartElementFunction<N>,
        executeCurrent?: ExecuteCurrentFunction<N>,
        getAdjacentElements?: GetAdjacentElementsFunction<N>,
        sortNextElements?: SortNextElementsFunction<N>,
        getStopCondition?: GetStopConditionFunction
    ) {

        const initialNodes = this.nodes
        const visited = new Set<N>()

        while (getStopCondition ? getStopCondition() : this._defaultGetStopCondition(visited, initialNodes)) {
            const nextStart = getStartElement ?
                getStartElement(this._notVisitedNodes(initialNodes, visited)) :
                this._defaultGetStartElement(initialNodes, visited);

            // end traversal if no nextNode
            if (!nextStart) break;

            // stack or queue
            const executionSequence: Array<N> = [nextStart]

            while (executionSequence.length > 0) {

                // push or pop
                const currentNode = executionSequence.pop()

                if (!currentNode) throw new Error(`Can't get current node in ${executionSequence}`)

                visited.add(currentNode)

                // execute currentNode
                if (executeCurrent) executeCurrent(currentNode)

                // get adjacent nodes for next iteration
                const nextNodes = getAdjacentElements ? getAdjacentElements(currentNode, this) : this._defaultGetAdjacentElements(currentNode, this)

                const notVisitedNextNodes = nextNodes.filter(node => !visited.has(node))

                const sortedNextNodes = sortNextElements ? sortNextElements(notVisitedNextNodes) : this._defaultSortNextElements(notVisitedNextNodes)

                if (isBfs) {
                    executionSequence.splice(0, 0, ...sortedNextNodes)
                }else {
                    executionSequence.splice(executionSequence.length, 0, ...sortedNextNodes)
                }

                const stopCondition = getStopCondition ? getStopCondition() : this._defaultGetStopCondition(visited, initialNodes)
                if (!stopCondition) break;
            }
        }
    }

    _defaultGetStartElement(nodes: Array<N>, visited: Set<N>) {
        return nodes.find(item => !visited.has(item))
    }

    _notVisitedNodes(nodes: Array<N>, visited: Set<N>) {
        return nodes.filter(item => !visited.has(item))
    }


    _defaultGetAdjacentElements(node: N, graph: Graph<N>) {
        return [...graph.getOutgoingEdgesFor(node)].map(edge => edge.target)
    }

    _defaultSortNextElements(nodes: Array<N>) {

        // return unsorted by default
        return nodes
    }

    _defaultGetStopCondition(visited: Set<N>, initialNodes: Array<N>){
        return initialNodes.length > visited.size
    }

}