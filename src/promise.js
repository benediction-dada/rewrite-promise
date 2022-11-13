const PENDING = 'pending'
const FULLFILLED = 'fullfilled'
const REJECTED = 'rejected'

class MyPromise {
    PromiseState = PENDING
    PromiseResult = undefined

    fullfulledCallbacks = []
    rejectedCallbacks = []

    constructor(executor) {
        try {
            executor(this.resolve, this.reject)
        } catch (err) {
            this.reject(err)
        }
    }
    resolve = (val) => {
        if (this.PromiseState !== PENDING) return
        this.PromiseState = FULLFILLED
        this.PromiseResult = val
        while (this.fullfulledCallbacks.length) {
            this.fullfulledCallbacks.shift()()
        }
    }
    reject = (reason) => {
        if (this.PromiseState !== PENDING) return
        this.PromiseState = REJECTED
        this.PromiseResult = reason
        while (this.rejectedCallbacks.length) {
            this.rejectedCallbacks.shift()()
        }
    }
    then(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : val => val
        onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

        const promiseThen = new MyPromise((resolve, reject) => {
            const callbackPromiseHandler = callback => {
                queueMicrotask(() => {
                    try {
                        const temp = callback(this.PromiseResult)
                        if (temp === promiseThen) {
                            throw { msg: "then函数不可以返回自身" }
                        }
                        if (temp instanceof MyPromise) {
                            temp.then(resolve, reject)
                        } else {
                            resolve(temp)
                        }
                    } catch (err) {
                        reject(err)
                    }

                })
            }
            switch (this.PromiseState) {
                case REJECTED: {
                    callbackPromiseHandler(onRejected)
                    break;
                }
                case PENDING: {
                    this.fullfulledCallbacks.push(callbackPromiseHandler.bind(this, onFulfilled))
                    this.rejectedCallbacks.push(callbackPromiseHandler.bind(this, onRejected))
                    break;
                }
                case FULLFILLED: {
                    callbackPromiseHandler(onFulfilled)
                    break;
                }
            }
        })
        return promiseThen
    }
}
