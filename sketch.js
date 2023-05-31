//music
let Super;

//amplitude
let amplitude;

//spectrum
let fft;
let spectrum;

//particle
let particles = [];
const numParticles = 500;
const radius = 200;
const centerX = 640;
const centerY = 360;
const maxDistance = 200; //Maximum distance allowed for particles to leave the circle
let lowColor, highColor;

//여의봉
let capture;
let poseNet;
let myPose;
let Mready;

//button
let buttonPlay;
let buttonStop;
let slider;
let sec;
let currentTime = 0;

function preload() {
  Super = loadSound("super.m4a");
}

function setup() {
  createCanvas(1280, 720);

  //play button
  buttonPlay = createButton("Play");
  buttonPlay.position(0, 720);
  buttonPlay.size(50, 50);
  buttonPlay.mousePressed(buttonPlayPressed);

  //stop button
  buttonStop = createButton("Stop");
  buttonStop.position(50, 720);
  buttonStop.size(50, 50);
  buttonStop.mousePressed(buttonStopPressed);

  //progress bar
  let sec = Super.duration(); //?? 어떻게 slider로 음악 플레이 시간을 변하는가?
  slider = createSlider(0, sec, 0, 0.1);
  slider.position(100, 720);
  slider.size(1000, 50);
  slider.changed(sliderChanged);

  //music amplitude
  amplitude = new p5.Amplitude();

  lowColor = color(255, 165, 0); // orange
  highColor = color(255, 0, 0); // red

  for (let i = 0; i < numParticles; i++) {
    const angle = map(i, 0, numParticles, 0, TWO_PI);
    const x = centerX + radius * cos(angle);
    const y = centerY + radius * sin(angle);
    particles.push(new Particle(x, y));
  }

  //fft
  fft = new p5.FFT();
  fft.setInput(Super);

  //camera position
  push();
  capture = createCapture(VIDEO);
  capture.size(320, 240);
  capture.position(width / 2 - 320 / 2, height / 2 - 240 / 2);
  capture.hide();
  pop();

  poseNet = ml5.poseNet(capture, modelLoaded);
  poseNet.on("pose", onPose);
}

function sliderChanged() {
  Super.pause();
  currentTime = slider.value();
  //console.log("slider", slider.value());
  //Super.jump(slider.value());
  // Super.play();
}

function modelLoaded() {
  console.log("ok");
}

function onPose(poses) {
  if (poses.length > 0) {
    myPose = poses[0].pose;
  }
  //console.log(myPose);
}

function draw() {
  background(0);
  noStroke();
  fill(255);
  rect(50,50,100,100);

  let level = amplitude.getLevel();
  spectrum = fft.analyze();

  let lerpedColor = lerpColor(lowColor, highColor, level);

  // console.log(Super.currentTime());
  if (Super.currentTime() < 85) {
    //circles pattern

    for (let i = 0; i < particles.length; i++) {
      particles[i].update(level);
      particles[i].display(lerpedColor);
    }
  } else {
    //rectangle pattern
    // spectrum bars
    colorMode(HSB, 360, 100, 100);
    for (let i = 0; i < spectrum.length; i++) {
      let x = i * 20;
      let h = map(spectrum[i], 0, 255, 0, height / 2);
      let hue = map(i, 0, spectrum.length, 0, 360);
      let brightness = map(spectrum[i], 0, 255, 50, 100);

      // motion
      push();
      translate(x, height);
      rotate(radians(frameCount * 0.4)); // rotate
      scale(1, map(spectrum[i], 0, 255, 0.5, 2)); // scale

      fill(hue, 100, brightness);
      rectMode(CENTER);
      rect(0, 0, 10, -h); // rectangle

      pop();
    }
  }

  if (Super.isPlaying()) {
    slider.value(Super.currentTime());
  }

  //camera
  push();

  if (myPose) {
    let distWrist = dist(
      myPose.leftWrist.x,
      myPose.leftWrist.y,
      myPose.rightWrist.x,
      myPose.rightWrist.y
    ); //distance from leftWrist and rightWrist
    if (distWrist < 70) {
      Mready = 1;
    }

    if (distWrist > 300) {
      Mready = 0;
    }
  }

  //여의봉
  //appear - MagicStick
  if (Mready == 1) {
    translate(320 + width / 2 - 320 / 2, height / 2 - 240 / 2);
    scale(-1, 1);
    image(capture, 0, 0);
    colorMode(RGB);
    stroke(255, 165, 0);
    strokeWeight(10);
    line(
      myPose.leftWrist.x,
      myPose.leftWrist.y,
      myPose.rightWrist.x,
      myPose.rightWrist.y
    );
  }

  //disappear
  if (Mready == 0) {
  }

  pop();
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(10, 50);
    this.speed = random(1, 10);
  }

  update(level) {
    this.x += random(-level * this.speed, level * this.speed);
    this.y += random(-level * this.speed, level * this.speed);
    this.size = map(level, 0, 1, 10, 40);

    // check if the particles are in the circle
    const distance = dist(this.x, this.y, centerX, centerY);
    if (distance < radius) {
      // put the particles that in the circle back
      const angle = atan2(this.y - centerY, this.x - centerX);
      this.x = centerX + radius * cos(angle);
      this.y = centerY + radius * sin(angle);
    }

    // check if the particles are out of circle
    if (distance > radius + maxDistance) {
      // if they're too far away put them back
      const angle = atan2(this.y - centerY, this.x - centerX);
      this.x = centerX + (radius + maxDistance) * cos(angle);
      this.y = centerY + (radius + maxDistance) * sin(angle);
    }
  }

  display(color) {
    fill(color);
    ellipse(this.x, this.y, this.size);
  }
}

function buttonPlayPressed() {
  if (!Super.isPlaying()) {
    Super.play();
    Super.jump(currentTime);
  }
}

function buttonStopPressed() {
  if (Super.isPlaying()) {
    Super.pause();
  }
}
