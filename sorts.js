module.exports = {
    nearest: refPos => (a, b) => a && a.pos.getRangeTo(refPos) ? b && b.pos.getRangeTo(refPos) ? a.pos.getRangeTo(refPos) - b.pos.getRangeTo(refPos) : 0 : 0
}