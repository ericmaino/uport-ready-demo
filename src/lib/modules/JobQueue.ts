import winston = require('winston');

class Job {
    private func;
    public promise;
    private resolve;
    private reject;

    constructor(func) {
        this.func = func;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    public Execute() {
        return this.func()
            .then(result => this.resolve(result))
            .catch(err => this.reject(err));
    }
}

export class JobQueue {
    private readonly requestMax = 10;
    private queue: Array<Job>;
    private pendingQueue: Array<Job>;
    private processing = 0;

    constructor() {
        this.queue = new Array<Job>();
        this.pendingQueue = new Array<Job>();
    }

    public ExecuteJob(func) {
        var job = new Job(func);
        this.queue.push(job);

        if (!this.processing) {
            this.StartProcessingQueue();
        }

        return job.promise;
    }

    private async ProcessQueue(_self: JobQueue) {
        while (_self.queue.length > 0 && _self.pendingQueue.length < _self.requestMax) {
            if (_self.pendingQueue.length < _self.requestMax) {
                var job = _self.queue.pop();
                _self.pendingQueue.push(job);
                let result = await job.Execute();
                _self.pendingQueue.pop();

                if (_self.queue.length > 0 && !_self.processing) {
                    _self.StartProcessingQueue();
                }

            }
        }

        _self.processing = 0;
    }

    private StartProcessingQueue() {
        this.processing = 1;
        let _self = this;
        setTimeout(async () => { await _self.ProcessQueue(_self); }, 100);
    }
}