export function addToEnd<N>(nodes: Array<N>, executionSequence: Array<N>){
    for (const node of nodes) {
        executionSequence.push(node)
    }
}

export function addToStart<N>(nodes: Array<N>, executionSequence: Array<N>){
    for (const node of nodes) {
        executionSequence.unshift(node)
    }
}