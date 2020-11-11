/*
 * Server: A program that executes a task
 * A Task: Progress bar filling itself completely
 * Assumption: All task are similar, show progress bar for 20 seconds
 */

var task_queued_evt = new Event('task-queued');
var server_count_evt = new Event('server-count');

var ServerStack = function() {
    this.task_count = 0;
    this.stack = [];
    this.tasks = [];
    this.events = new EventTarget();
    this.lastServer = 0;



    this.add();

    setInterval(function() {
        console.log('Looking for task', this.tasks.length, this.stack.length);
        if(this.tasks.length){
            var task = this.tasks[0];
            if(task.abort){
                this.tasks.shift();
                return;
            }
            if(this.assignTask(task)){
                this.tasks.shift()
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
    this.events.dispatchEvent(
        new CustomEvent('server-count-changed', {detail: this})
    );
    return {"success": "server added successfully", server: server};
}

ServerStack.prototype.sendTask = function() {
    if(this.task.length) {
        return this.task.shift();
    }
}

ServerStack.prototype.addTask = function(task) {
    task = new task();
    task.id = this.task_count;
    this.task_count +=1;
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
    this.stack.pop();
    if(this.lastServer > this.stack.length){
        this.lastServer = 0
    }
    this.events.dispatchEvent(
        new CustomEvent('server-count-changed', {detail: this})
    );
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
    this.task.run().then(function() {
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
    this.server = false;
    this.id = false;
    this.running = false;
    this.abort = false;

    this.events = new EventTarget();
}

Task.prototype.run = function() {
    this.running = true;

    return new Promise(function(resolve, reject){
        if(this.abort){
            reject();
        }else{
            this.events.dispatchEvent(
                new CustomEvent('task-running', {detail: this})
            );

            setTimeout(function() {
                this.events.dispatchEvent(
                    new CustomEvent('task-complete', {detail: this})
                );
                resolve();
            }.bind(this), 20 * 1000)
        }
    }.bind(this))
}

Task.prototype.stop = function() {
    if(this.running){
        return {"error": "Task is already running"}
    }

    this.abort = true;
    this.events.dispatchEvent(
        new CustomEvent('task-aborted', {detail: this})
    );
}

server_stack = new ServerStack();
