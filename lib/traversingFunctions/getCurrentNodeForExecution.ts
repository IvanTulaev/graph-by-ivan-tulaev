export function getLast<N>(executionSequence: Array<N>){
    return executionSequence.pop()
}

export function getFirst<N>(executionSequence: Array<N>){
    return executionSequence.shift()
}

