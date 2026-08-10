//////////////////
// ABOUT LAYOUT //
//////////////////
// This utility allows you to easily create typed views into a contiguous block of memory.

// Tracks the byte offset of the latest view you create.
// This is global, mutable state, but it's probably the best way to do this
let Layout_byteOffset = 0;

function Layout_align(bytes) {
    return (Layout_byteOffset + bytes - 1) & ~(bytes - 1);
}
function Layout_move(bytes, length) {
    return Layout_byteOffset + (bytes * length);
}

// Reserves an aligned byte offset for a view and advances the cursor accordingly.
const Layout_reserve = (bytes, length) => {
    Layout_byteOffset = Layout_align(bytes);
    Layout_byteOffset = Layout_move(bytes, length);
    return Layout_byteOffset;
};

//////////////////////////////////
// View Creation Helper Methods //
//////////////////////////////////
// Create specific typed views.

const Layout_createF32View = (buffer, length) => new Float32Array(buffer, Layout_reserve(4, length), length);

const Layout_createU32View = (buffer, length) => new Uint32Array(buffer, Layout_reserve(4, length), length);

const Layout_createU8View = (buffer, length) => new Uint8Array(buffer, Layout_reserve(1, length), length);