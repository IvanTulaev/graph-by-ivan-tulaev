import {Graph} from "@@/lib/index.js";

export function getNotVisitedOutgoingNodes<N> (node: N, graph: Graph<N>, visited: Set<N>) {
    return [...graph.getOutgoingEdgesFor(node)]
        .map(edge => edge.target)
        .filter(target => !visited.has(target))
}

export function getNotVisitedIncomingNodes<N> (node: N, graph: Graph<N>, visited: Set<N>) {
    return [...graph.getIncomingEdgesFor(node)]
        .map(edge => edge.source)
        .filter(source => !visited.has(source))
}