const PENDING = 'pending'
const FULLFILLED = 'fullfilled'
const REJECTED = 'rejected'


class MyPromise {
    PromiseState = PENDING
    PromiseResult = undefined

    constructor(executor) {
        try {
            executor(this.resolve, this.reject)
        } catch (err) {
            this.reject(err)
        }
    }
    resolve = (val) => {
        if(this.PromiseState !== PENDING) return
        this.PromiseState = FULLFILLED
        this.PromiseResult = val
        return this
    }
    reject = (reason) => {
        if(this.PromiseState !== PENDING) return 
        this.PromiseState = REJECTED
        this.PromiseResult = reason
    }
}
