const MSG_OBJECT_ADDED = 1;
const MSG_OBJECT_REMOVED = 2;
const MSG_ALL = 3;  // special message for global subscribers, usually for debugging

const STATE_INACTIVE = 0;
const STATE_UPDATABLE = 2 ^ 0;
const STATE_DRAWABLE = 2 ^ 1;
const STATE_LISTENING = 2 ^ 2;

// unit size in px - all attributes are calculated against this size
var UNIT_SIZE = 1;
