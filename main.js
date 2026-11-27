// YogurtLib Auton Sim
//
// Units: inches. Field center is (0, 0), field spans -72..72 on x and y.
// Heading: math convention, degrees (east = 0, north = 90, CCW positive).


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FIELD_SIZE = 144;   // in
const TILE_SIZE = 24;     // in
const CANVAS_SIZE = 720;  // px

const ROBOT_WIDTH = 15;   // in
const ROBOT_LENGTH = 15;  // in

const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;


// ---------------------------------------------------------------------------
// Math
// ---------------------------------------------------------------------------

function deg2rad(deg) {
    return deg * Math.PI / 180;
}

// Shortest signed angle from current to target, in [-180, 180).
function angleDiffDeg(target, current) {
    // TODO
    return target - current;
}


// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

// Field point (in) -> canvas point (px).
function fieldToCanvas(x, y) {
    let px = canvas.width / 2 + inchesToPixels(x);
    let py = canvas.height / 2 - inchesToPixels(y); // y is flipped for canvas
    return { px: px, py: py };
}

// Length (in) -> length (px).
function inchesToPixels(inches) {
    return inches * CANVAS_SIZE / FIELD_SIZE;
}

function drawDot(x, y, color) {
    const { px, py } = fieldToCanvas(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawField() { // Draws the grids onto the fields
    ctx.fillStyle = "#3a3d45";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const half = FIELD_SIZE / 2;
    ctx.strokeStyle = "#5a5e68";
    ctx.lineWidth = 1;

    for (let i = 0; i <= FIELD_SIZE / TILE_SIZE; i++) {
        const v = i * TILE_SIZE - half; // tile line position in inches

        // Draws vertical line connecting top to bottom
        const top = fieldToCanvas(v, half);
        const bottom = fieldToCanvas(v, -half);
        ctx.beginPath();
        ctx.moveTo(top.px, top.py);
        ctx.lineTo(bottom.px, bottom.py);
        ctx.stroke();

        // Draws horizontal line at positions v
        const left = fieldToCanvas(-half, v);
        const right = fieldToCanvas(half, v);
        ctx.beginPath();
        ctx.moveTo(left.px, left.py);
        ctx.lineTo(right.px, right.py);
        ctx.stroke();
    }
}

// style: "solid" (true pose) or "ghost" (believed pose)
function drawRobot(pose, style) {
    // Converting robot coordinates to field coordinates, then to canvas coordinates
    const theta = deg2rad(pose.theta);
    const cos = Math.cos(theta), sin = Math.sin(theta); // forward * cos = x, forward * sin = y

    function toCanvas(forward, left) { // Converts to field coordinates by adding on to center pose, then to canvas
        let fieldX = pose.x + forward * cos - left * sin; // + (-left) * sin(theta)
        let fieldY = pose.y + forward * sin + left * cos; // + (left) * cos(theta)
        return fieldToCanvas(fieldX, fieldY);
    }


    const halfL = ROBOT_LENGTH / 2, halfW = ROBOT_WIDTH / 2;
    const corners = [ toCanvas(halfL, -halfW), 
                      toCanvas(halfL, halfW), 
                      toCanvas(-halfL, halfW), 
                      toCanvas(-halfL, -halfW) ];
    ctx.beginPath();
    ctx.moveTo(corners[0].px, corners[0].py); // Move to the first corner
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].px, corners[i].py); // Joins
    ctx.closePath(); // Closes

    if (style === "solid") { // Finally decide colour
        ctx.fillStyle = "#f5c542";
        ctx.fill(); // Fill
    } else {
        ctx.strokeStyle = "#8ab4f8";
        ctx.lineWidth = 2;
        ctx.stroke(); // Outline
    }

    // heading line from center of the robot to the front
    const center = toCanvas(0, 0), front = toCanvas(halfL, 0);
    ctx.strokeStyle = style === "solid" ? "#1a1a1a" : "#8ab4f8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center.px, center.py);
    ctx.lineTo(front.px, front.py);
    ctx.stroke();
}


// ---------------------------------------------------------------------------
// Poses
// ---------------------------------------------------------------------------

const truePose = { x: 0, y: 0, theta: 90 };      // actual position
const believedPose = { x: 0, y: 0, theta: 90 };  // what odometry/MCL thinks


// ---------------------------------------------------------------------------
// Route: mirrors yogurt::Drivetrain calls (dt.hpp), same argument names
// ---------------------------------------------------------------------------

const START_POSE = { x: -48, y: -48, theta: 90 };

const route = [
    { fn: "driveStraight", args: { distanceInches: 48, timeoutMs: 2000 }, params: {}, async: false },
    { fn: "turnToHeading", args: { targetDeg: 0, timeoutMs: 1000 },       params: {}, async: false },
    { fn: "driveStraight", args: { distanceInches: 48, timeoutMs: 2000 }, params: {}, async: false },
    { fn: "turnToHeading", args: { targetDeg: -90, timeoutMs: 1000 },     params: {}, async: false },
];


// ---------------------------------------------------------------------------
// Motions (kinematic, no physics yet)
// ---------------------------------------------------------------------------

const DRIVE_SPEED = 40;  // in/s
const TURN_SPEED = 180;  // deg/s

let commandIndex = 0;
let activeMotion = null;

// A motion is { update(dt) -> true when finished }.
function startMotion(cmd) {
  console.log(cmd.fn)
    switch (cmd.fn) {
        case "driveStraight": return makeDriveStraight(cmd);
        case "turnToHeading": return makeTurnToHeading(cmd);
        default:
        console.warn("Unsupported command: " + cmd.fn);
        return null;
    }
}

function makeDriveStraight(cmd) {
    // TODO
    return { update(dt) { return true; } };
}

function makeTurnToHeading(cmd) {
    // TODO
    return { update(dt) { return true; } };
}

function updateRunner(dt) {
    if (activeMotion == null && commandIndex < route.length) {
      activeMotion = startMotion(route[commandIndex++]); // Hoping the ++ works the same as it does in Cpp
    }
    else if (activeMotion != null) {
      let done = activeMotion.update(dt);
      if (done) activeMotion = null;

    }
}


// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

let playing = false;
let speedMultiplier = 1;
let lastTime = null;

function resetSim() {
    Object.assign(truePose, START_POSE);
    Object.assign(believedPose, START_POSE);
    commandIndex = 0;
    activeMotion = null;
}

function frame(now) {
    if (lastTime === null) lastTime = now;
    const dt = Math.min((now - lastTime) / 1000, 0.05) * speedMultiplier; // cap so tab switches don't teleport
    lastTime = now;

    if (playing) {
        updateRunner(dt);
        Object.assign(believedPose, truePose); // no noise yet
    }

    drawField();
    drawRobot(believedPose, "ghost");
    drawRobot(truePose, "solid");
    updatePanel();

    requestAnimationFrame(frame);
}


// ---------------------------------------------------------------------------
// Side panel
// ---------------------------------------------------------------------------

function poseText(p) {
    return `x: ${p.x.toFixed(1)}  y: ${p.y.toFixed(1)}  θ: ${p.theta.toFixed(1)}°`;
}

function updatePanel() {
    document.getElementById("truePoseText").textContent = poseText(truePose);
    document.getElementById("believedPoseText").textContent = poseText(believedPose);
    const cmd = route[commandIndex - 1];
    document.getElementById("commandText").textContent =
    activeMotion && cmd ? `${cmd.fn}(${Object.values(cmd.args).join(", ")})` : "idle";
}

const playBtn = document.getElementById("playBtn");
playBtn.addEventListener("click", () => {
        playing = !playing;
        playBtn.textContent = playing ? "Pause" : "Play";
});

document.getElementById("resetBtn").addEventListener("click", () => {
        resetSim();
        playing = false;
        playBtn.textContent = "Play";
});

document.getElementById("speedSlider").addEventListener("input", (e) => {
        speedMultiplier = Number(e.target.value);
        document.getElementById("speedLabel").textContent = speedMultiplier + "x";
});

resetSim();
requestAnimationFrame(frame);