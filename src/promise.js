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
    static resolve(val) {
        if(val instanceof Promise) return val
        return new Promise(resolve => resolve(val))
    }
    static reject(reason) {
        return new Promise((resolve, reject) => reject(reason))
    }
    static all(arr) {
        return new Promise ((resolve, reject) => {
            const result = []
            let count = 0
            const addData = (item, index) => {
                result[index] = item
                if(++count === arr.length) {
                    resolve(result)
                }
            }
            arr.forEach((item, index) => {
                if(item instanceof Promise) {
                    item.then(val => addData(val, index), reject)
                } else {
                    queueMicrotask(() => {
                        addData(item, index)
                    })
                }
            });
        })
    }
    static allSettled(arr) {
        return new Promise((resolve, reject) => {
            const result = []
            let count = 0
            const addData = (status, item, index) => {
                result[index] = {
                    status
                }
                if(status === FULLFILLED) {
                    result[index]['value'] = item
                }
                if(status === REJECTED) {
                    result[index]['reason'] = item
                }
                if(++count === arr.length) {
                    result(result)
                }
            }

            arr.forEach((item, index) => {
                if(item instanceof Promise) {
                    item.then(val => addData(FULLFILLED, val, index), reason => addData(REJECTED, reason, index))
                } else {
                    queueMicrotask(() => {
                        resolve(item)
                    })
                }
            })
        })
    }
    static race(arr) {
        return new Promise((resolve, reject) => {
            const count = 0
            arr.forEach(item => {
                if(item instanceof Promise) {
                    item.then(resolve, reject)
                } else {
                    queueMicrotask(() => {
                        resolve(item)
                    })
                }
            })
        })
        
    }
    static any(arr) {
        return new Promise((resolve, reject) => {
            arr.forEach(item => {
                if(item instanceof Promise) {
                    item(resolve, () => {
                        if(++count === arr.length) {
                            throw { msg: 'all promises were rejected' }
                        }
                    })
                } else {
                    queueMicrotask(() => {
                        resolve(item)
                    })
                }
            })
        })
    }
}
