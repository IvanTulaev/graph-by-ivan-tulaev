//TODO: add Type for Graph

import {Graph} from "@@/lib/index.js";

export function getFirstUnvisited<N> (visited: Set<N>, initialGraph: Graph<N>){
    return initialGraph.nodes.find(item => !visited.has(item))
}

