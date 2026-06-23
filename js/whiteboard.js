/* ==========================================================
   WHITEBOARD ENGINE
   FabricJS + Undo/Redo + Save/Load + P2P Hooks
========================================================== */

window.boardCanvas = null;
let boardCanvas;
let undoStack = [];
let redoStack = [];

let isRemoteUpdate = false;

/* ==========================================================
   INIT
========================================================== */

function initWhiteboard() {

    const canvasElement =
        document.getElementById("boardCanvas");

    const wrapper =
        document.querySelector(".canvas-wrapper");

    boardCanvas = new fabric.Canvas(
        "boardCanvas",
        {
            isDrawingMode: true,
            preserveObjectStacking: true,
            selection: true
        }
    );
    window.boardCanvas = boardCanvas;
    resizeCanvas();

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    boardCanvas.freeDrawingBrush.width = 3;
    boardCanvas.freeDrawingBrush.color = "#2563eb";

    registerCanvasEvents();

    saveState();

    console.log("Whiteboard Ready");
}

/* ==========================================================
   RESIZE
========================================================== */

function resizeCanvas() {

    const wrapper =
        document.querySelector(".canvas-wrapper");

    if (!wrapper || !boardCanvas) return;

    boardCanvas.setWidth(
        wrapper.clientWidth
    );

    boardCanvas.setHeight(
        wrapper.clientHeight
    );

    boardCanvas.renderAll();
}

/* ==========================================================
   DRAW MODE
========================================================== */

function enableDrawMode() {

    boardCanvas.isDrawingMode = true;

    boardCanvas.selection = false;

    boardCanvas.forEachObject(obj => {
        obj.selectable = false;
    });

    console.log("Draw Mode");
}

/* ==========================================================
   SELECT MODE
========================================================== */

function enableSelectMode() {

    boardCanvas.isDrawingMode = false;

    boardCanvas.selection = true;

    boardCanvas.forEachObject(obj => {
        obj.selectable = true;
    });

    console.log("Select Mode");
}

/* ==========================================================
   CLEAR
========================================================== */

function clearBoard() {

    boardCanvas.clear();

    saveState();

    broadcastWhiteboard();

}

/* ==========================================================
   STATE SAVE
========================================================== */

function saveState() {

    if (isRemoteUpdate) return;

    const json =
        JSON.stringify(
            boardCanvas.toJSON()
        );

    undoStack.push(json);

    if (undoStack.length > 50) {
        undoStack.shift();
    }

    redoStack = [];

}

/* ==========================================================
   UNDO
========================================================== */

function undoBoard() {

    if (undoStack.length <= 1)
        return;

    const current =
        undoStack.pop();

    redoStack.push(current);

    const previous =
        undoStack[
            undoStack.length - 1
        ];

    isRemoteUpdate = true;

    boardCanvas.loadFromJSON(
        previous,
        () => {

            boardCanvas.renderAll();

            isRemoteUpdate = false;

            broadcastWhiteboard();
        }
    );

}

/* ==========================================================
   REDO
========================================================== */

function redoBoard() {

    if (redoStack.length === 0)
        return;

    const state =
        redoStack.pop();

    undoStack.push(state);

    isRemoteUpdate = true;

    boardCanvas.loadFromJSON(
        state,
        () => {

            boardCanvas.renderAll();

            isRemoteUpdate = false;

            broadcastWhiteboard();
        }
    );

}

/* ==========================================================
   DELETE SELECTED
========================================================== */

function deleteSelectedObject() {

    const active =
        boardCanvas.getActiveObject();

    if (!active) return;

    boardCanvas.remove(active);

    boardCanvas.renderAll();

    saveState();

    broadcastWhiteboard();
}

/* ==========================================================
   STICKY NOTE
========================================================== */

function addStickyNote() {

    const note =
        new fabric.IText(
            "Double Click To Edit",
            {
                left: 100,
                top: 100,
                width: 200,
                fontSize: 18,

                backgroundColor:
                    "#fff3b0",

                padding: 10
            }
        );

    boardCanvas.add(note);

    boardCanvas.setActiveObject(note);

    boardCanvas.renderAll();

    saveState();

    broadcastWhiteboard();
}

/* ==========================================================
   SHAPE TOOLS
========================================================== */

function addRectangle() {

    const rect =
        new fabric.Rect({
            left: 100,
            top: 100,
            width: 150,
            height: 80,

            fill: "#60a5fa"
        });

    boardCanvas.add(rect);

    saveState();

    broadcastWhiteboard();
}

function addCircle() {

    const circle =
        new fabric.Circle({

            left: 100,
            top: 100,

            radius: 50,

            fill: "#34d399"

        });

    boardCanvas.add(circle);

    saveState();

    broadcastWhiteboard();
}

/* ==========================================================
   SAVE SESSION
========================================================== */

function saveSessionFile() {

    const data = {

        notebookPages:
            window.notebookPages || [],

        currentPage:
            window.currentPage || 0

    };

    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:
                "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        "classroom-session.json";

    a.click();

    URL.revokeObjectURL(url);

}

/* ==========================================================
   LOAD SESSION
========================================================== */

function loadSessionFile(file) {

    const reader =
        new FileReader();

    reader.onload = function(e) {

        try {

            const data =
                JSON.parse(
                    e.target.result
                );

            window.notebookPages =
                data.notebookPages;

            window.currentPage =
                data.currentPage;

            if (
                typeof loadCurrentPage
                === "function"
            ) {
                loadCurrentPage();
            }

        }
        catch(err) {

            alert(
                "Invalid Session File"
            );

            console.error(err);

        }

    };

    reader.readAsText(file);

}

/* ==========================================================
   P2P SYNC
========================================================== */

function broadcastWhiteboard() {

    if(
        typeof saveCurrentPage
        === "function"
    ){
        saveCurrentPage();
    }

    sendWhiteboardData({

        type:"page-sync",

        pageIndex:
        window.currentPage,

        canvas:
        JSON.stringify(
            boardCanvas.toJSON()
        )

    });

}

/* ==========================================================
   RECEIVE REMOTE
========================================================== */

function loadRemoteCanvas(
    canvasJSON
) {

    isRemoteUpdate = true;

    boardCanvas.loadFromJSON(
        canvasJSON,
        () => {

            boardCanvas.renderAll();

            isRemoteUpdate = false;

            saveState();

        }
    );

}

/* ==========================================================
   EVENTS
========================================================== */

function registerCanvasEvents() {

    boardCanvas.on(
        "path:created",
        () => {

            saveState();

            broadcastWhiteboard();

        }
    );

    boardCanvas.on(
        "object:modified",
        () => {

            saveState();

            broadcastWhiteboard();

        }
    );

    boardCanvas.on(
        "object:added",
        () => {

            if (
                isRemoteUpdate
            ) return;

            saveState();

        }
    );

    boardCanvas.on(
        "text:editing:exited",
        () => {

            saveState();

            broadcastWhiteboard();

        }
    );

}

/* ==========================================================
   BUTTONS
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initWhiteboard();

        document
        .getElementById(
            "drawBtn"
        )
        ?.addEventListener(
            "click",
            enableDrawMode
        );

        document
        .getElementById(
            "selectBtn"
        )
        ?.addEventListener(
            "click",
            enableSelectMode
        );

        document
        .getElementById(
            "undoBtn"
        )
        ?.addEventListener(
            "click",
            undoBoard
        );

        document
        .getElementById(
            "redoBtn"
        )
        ?.addEventListener(
            "click",
            redoBoard
        );

        document
        .getElementById(
            "saveBtn"
        )
        ?.addEventListener(
            "click",
            saveSessionFile
        );

        document
        .getElementById(
            "loadFileInput"
        )
        ?.addEventListener(
            "change",
            e => {

                if (
                    e.target.files
                        .length
                ) {

                    loadSessionFile(
                        e.target.files[0]
                    );

                }

            }
        );

    }
); 
