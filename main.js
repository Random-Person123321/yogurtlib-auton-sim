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
    // TODO
    return { px: CANVAS_SIZE / 2, py: CANVAS_SIZE / 2 };
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

function drawField() {
    ctx.fillStyle = "#3a3d45";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    // TODO: tile grid
}

// style: "solid" (true pose) or "ghost" (believed pose)
function drawRobot(pose, style) {
    // TODO
    drawDot(pose.x, pose.y, style === "solid" ? "#f5c542" : "#8ab4f8");
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
    // TODO
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