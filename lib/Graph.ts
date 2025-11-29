import {getFirstUnvisited} from "@@/lib/traversingFunctions/getStartElement.js";
import {getLast} from "@@/lib/traversingFunctions/getCurrentNodeForExecution.js";
import {addToEnd} from "@@/lib/traversingFunctions/addToExecutionSequence.js";
import {getNotVisitedIncomingNodes, getNotVisitedOutgoingNodes} from "@@/lib/traversingFunctions/getNextNodes.js";

export interface IEdge<N> {
    source: N
    target: N
}

export type GetStartElementFunction<N> = (visited: Set<N>, initialGraph: Graph<N>) => N | undefined
export type GetNextFromExecutionSequence<N> = (executionSequence: Array<N>) => N | undefined
export type ExecuteCurrentFunction<N> = (node: N) => void
export type GetNextNodesFunction<N> = (node: N, graph: Graph<N>, visited: Set<N>, executionSequence: Array<N>) => Array<N> | undefined
export type AddNextNodesToExecutionSequence<N> = (nodes: Array<N>, executionSequence: Array<N>) => void;

interface IAdjacencyValueElement<N>{
    incoming: Set<IEdge<N>>, outgoing: Set<IEdge<N>>
}

export class Graph<N> {

    notDirected: boolean
    private _adjacencyList: Map<N, IAdjacencyValueElement<N>>

    constructor(notDirected: boolean = false) {
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
                if (edge.source !== node && edge.target !== node) continue;
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
     * @param getStartElement get first unvisited by default
     * @param getNextFromExecutionSequence get last by default
     * @param getNextNodes get not visited outgoing elements by default
     * @param addNextNodesToExecutionSequence add to end by default
     * @param executeCurrent
     */
    genericTraversing(
        getStartElement: GetStartElementFunction<N> = getFirstUnvisited,
        getNextFromExecutionSequence: GetNextFromExecutionSequence<N> = getLast,
        getNextNodes: GetNextNodesFunction<N> = getNotVisitedOutgoingNodes,
        addNextNodesToExecutionSequence: AddNextNodesToExecutionSequence<N> = addToEnd,
        executeCurrent?: ExecuteCurrentFunction<N>,
    ) {

        const visited = new Set<N>()

        while (visited.size < this.nodes.length) {

            // undefined next start will be stop iteration
            const nextStart = getStartElement(visited, this)

            // end traversal if no nextNode
            if (!nextStart) break;

            // stack or queue
            const executionSequence: Array<N> = [nextStart]

            while (executionSequence.length > 0) {

                const currentNode = getNextFromExecutionSequence(executionSequence)

                if (!currentNode) throw new Error(`Can't get current node from ${executionSequence}`)

                if (executeCurrent) executeCurrent(currentNode)
                // execute currentNode
                visited.add(currentNode)

                // get nodes for next iteration
                // TODO: need stop iteration: example for traverse check
                const nextNodes = getNextNodes(currentNode, this, visited, executionSequence)

                //stop iteration if nextNodes === undefined
                // TODO: stop two levels of iteration!
                if (!nextNodes) break;

                addNextNodesToExecutionSequence(nextNodes, executionSequence)
            }
        }
    }

    // TODO: ADD OPTIMISATION
    getSeparatedGraphs(){
        const separatedGraphs = new Set<Graph<N>>()

        const getLocalGraph = (node: N, graph: Graph<N>) => {
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

            return localGraph
        }

        const getGraphsToMerge = (separatedGraphs: Set<Graph<N>>, localGraph: Graph<N>) => {
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

            return graphsToMerge
        }

        const getAllNotVisitedAdjacentNodes = (node: N, graph: Graph<N>, visited: Set<N>) => {

            // Получаем локальный граф состоящий из обрабатываемой вершины и всех с ней смежных вершин
            const localGraph = getLocalGraph(node, graph)

            const graphsToMerge = getGraphsToMerge (separatedGraphs, localGraph)

            if (graphsToMerge.size > 0) {
                for (const graphToMerge of graphsToMerge) {
                    separatedGraphs.delete(graphToMerge)
                }
                const mergedGraphs = Graph.mergeGraphs(graphsToMerge.add(localGraph))
                separatedGraphs.add(mergedGraphs)
            } else {
                separatedGraphs.add(localGraph)
            }

            return [...localGraph.nodes].filter(item => !visited.has(item))

        }


        this.genericTraversing(getFirstUnvisited<N>, getLast<N>, getAllNotVisitedAdjacentNodes, addToEnd<N> )

        return [...separatedGraphs]
    }

    // TODO: ADD OPTIMISATION for self loop
    isNodeTraced(node:N, to: N | Array<N>, backward: boolean = false){

        let isTraced = false

        const checkedEnds = [to].flat()

        const getStart =  (visited: Set<N>) => {

            return !visited.has(node) ?  node : undefined

        }

        const execCurrent = (curNode: N) => {
            if (node === curNode && checkedEnds.includes(curNode)) isTraced = true
        }

        const getNext = (node: N, graph: Graph<N>, visited: Set<N>) => {

            const notVisited = !backward ?
                getNotVisitedOutgoingNodes(node, graph, visited) :
                getNotVisitedIncomingNodes(node, graph, visited)

            if (notVisited.some(notVisitedNode => checkedEnds.includes(notVisitedNode))) {
                isTraced = true
                return
            }

            return notVisited
        }

        // todo: add node or function
        this.genericTraversing(getStart, getLast<N>, getNext, addToEnd, execCurrent)

        return isTraced
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
}