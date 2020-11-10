/*
 * Server: A program that executes a task
 * A Task: Progress bar filling itself completely
 */

var task_assigned_evt = new Event('task-assigned');
var task_queued_evt = new Event('task-queued');

var ServerStack = function() {
    this.stack = [];
    this.tasks = [];
    this.add();
    this.lastServer = 0;
    setInterval(function() {
        console.log('Looking for task', this.tasks.length, this.stack.length);
        if(this.tasks.length){
            var task = this.tasks[0];
            if(this.assignTask(task)){
                console.log("Server found")
                this.tasks.shift()
                document.dispatchEvent(task_assigned_evt);
            }
        }
    }.bind(this), 500)
}

ServerStack.prototype.add = function() {
    if(this.stack.length === 10){
        return {"error": "server reached max limit."};
    }
    
    server = new Server(this.sendTask)
    this.stack.push(server);
    return {"success": "server added successfully", server: server};
}

ServerStack.prototype.sendTask = function() {
    if(this.task.length) {
        return this.task.shift();
    }
}

ServerStack.prototype.addTask = function(task) {
    this.tasks.push(task)
}

ServerStack.prototype.assignTask = function(task) {
    var foundServer = false;
    var stoppedServer = [];
    for(i= this.lastServer; i< this.stack.length; i++){
        if(this.stack[i].isAvailable()) {
            console.log("Assigned");
            this.stack[i].add(task)

            foundServer = true;
            break;
        }else if(this.stack[i].stopped){
            stoppedServer.push(i);
        }
    }

    if(stoppedServer.length){
        this.stack = this.stack.filter(function(_, ind){ return stoppedServer.indexOf(ind) == -1 })
        this.lastServer = 0;
    }else{
        if(i == this.stack.length){
            this.lastServer = 0;
        }else{
            this.lastServer = i + 1;
        }
    }


    return foundServer;
}

ServerStack.prototype.remove = function() {
    if(this.stack.length === 1) {
        return {"error": "minimum 1 server required"}
    }
    this.stack[this.stack.length - 1].stop();
    return {"success": "server removed successfully", servers: this.servers};
}

var Server = function(){
    this.task = false;
    this.proccess = false;
    this.shutdown = false;
    this.stopped = false;
    this.poll();
    console.log("Server started")
}

Server.prototype.poll = function() {
    this.proccess = setInterval(function() {
        if (this.task){
            this.run();
        }
    }.bind(this), 500)
}

Server.prototype.run = function() {
    clearInterval(this.proccess);
    this.task().then(function() {
        this.task = false;
        if(this.shutdown){
            this.stopped = true;
        }else{
            this.poll();
        }
    }.bind(this))
}

Server.prototype.add = function (task) {
    this.task = task;
}

Server.prototype.stop = function () {
    this.shutdown = true;
}

Server.prototype.isAvailable = function() {
    if (this.shutdown){
        return false;
    }
    return !Boolean(this.task);
}

Task = function() {
    return new Promise(function(resolve, reject){
        setTimeout(function() {
            console.log('Task is running');
            resolve();
        }, 3 * 1000)
    })
}

server_stack = new ServerStack();

