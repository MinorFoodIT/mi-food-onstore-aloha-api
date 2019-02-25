/***
 rss stands for Resident Set Size, it is the total memory allocated for the process execution
 heapTotal is the total size of the allocated heap
 heapUsed is the actual memory used during the execution of our process
 * @param display
 */
function memusage(display = ''){
    console.log('---- mem info ----')
    console.log(display)
    const used = process.memoryUsage();
    for (let key in used) {
        console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }
}

module.exports = memusage