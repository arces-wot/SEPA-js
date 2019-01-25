const EventEmitter = require("events").EventEmitter
const partial = require("util").partial

// EVENTS
const NOTIFICATION = "notification"
const ADDED        = "added"
const REMOVED      = "removed"
const SUBSCRIBED   = "subscribed"
const ERROR        = "error"
const UNSUBSCRIBED = "unsubscribed"
const CONNECTERROR = "connection-error"

class Subscription extends EventEmitter {
    
    constructor(query,connection,alias){
        super()
        this._connection = connection
        this._unsubscribed = false;
        this._query = query
        //Math random ensure that the alias is unique but is not secure (cripto)
        this._alias = alias ? alias : Math.random().toString(26).slice(2)
        
        let handler = ((notification) => {
            if (notification.unsubscribed) {
                this._stream.close()
                this.emit(UNSUBSCRIBED, notification)
                this.removeAllListeners()
                this.setMaxListeners(0)
                this._unsubscribed = true;
            } else if (notification.error) {
                this.unsubscribe()
                this._stream.close()
                this.emit(ERROR, notification)
                this.removeAllListeners()
                this.setMaxListeners(0)
                this._unsubscribed = true;
            } else {
                notification = notification.notification
                if(notification.sequence === 0){
                    this.emit(SUBSCRIBED,notification)
                }
                this.emit(NOTIFICATION, notification)
                if (Object.keys(notification.addedResults).length)    this.emit(ADDED, notification.addedResults)
                if (Object.keys(notification.removedResults).length)  this.emit(REMOVED, notification.removedResults)
            }
        })
        
        this._stream = connection.notificationStream( {
            subscribe: {
                sparql: query,
                alias: this._alias
            }
        })

        this._stream.on("notification", handler.bind(this))

        this._stream.on("error", ((err) => {
            this._stream.close()
            this.emit(CONNECTERROR,err)
        }))
    }

    get alias() {
        return this._alias
    }

    get query(){
        return this._query
    }
    
    unsubscribe(){
        if(this._unsubscribed){
            throw new Error("Subscription already unsubscribed")
        }
        this._stream.send({ unsubscribe : { spuid : this._stream.spuid}})
    }

    kill(){
        this._scream.close()
    }
}

module.exports = Subscription