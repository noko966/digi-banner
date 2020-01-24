class Sketch {
  constructor(opts) {
    this.scene = new THREE.Scene();
    this.vertex = `varying vec2 vUv;void main() {vUv = uv;gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}`;
    this.fragment = opts.fragment;
    this.uniforms = opts.uniforms;
    this.renderer = new THREE.WebGLRenderer();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.duration = opts.duration || 2;
    this.debug = opts.debug || false;
    this.easing = opts.easing || "easeInOut";
    this.hardCodedAspect = 2.5;

    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseTargetX = 0;
    this.mouseTargetY = 0;

    this.clicker = document.getElementById("content");

    this.container = document.getElementById("slider");

    this.slidesImages = JSON.parse(this.container.getAttribute("data-slides"));
    this.alphaImages = JSON.parse(this.container.getAttribute("data-alphas"));

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.001,
      1000
    );

    this.camera.position.set(0, 0, 2);
    this.time = 0;
    this.current = 0;
    this.textures = [];
    this.slides = [];
    this.alphas = [];

    this.paused = true;
    this.initiate(() => {
      console.log(this.textures);
      this.setupResize();
      this.settings();
      this.addObjects();
      this.resize();
      this.mouseMove();
      this.clickEvent();
      this.play();
    });
  }

  initiate(cb) {
    const promises = [];
    let that = this;

    this.slidesImages.forEach((url, i) => {
      let promise = new Promise(resolve => {
        that.slides[i] = new THREE.TextureLoader().load(url, resolve);
        that.slides[i].needsUpdate = true;
      });
      promises.push(promise);
    });

    this.alphaImages.forEach((url, i) => {
      let promise = new Promise(resolve => {
        that.alphas[i] = new THREE.TextureLoader().load(url, resolve);
        that.alphas[i].needsUpdate = true;
      });
      promises.push(promise);
    });

    Promise.all(promises).then(() => {
      cb();
    });
  }

  mouseMove() {
    let that = this;
    document.addEventListener("mousemove", function(e) {
      let halfX = that.width / 2;
      let halfY = that.height / 2;

      that.mouseTargetX = (halfX - e.clientX) / halfX;
      that.mouseTargetY = (halfY - e.clientY) / halfY;
    });
  }

  clickEvent() {
    this.clicker.addEventListener("click", () => {
      this.next();
    });
  }
  settings() {
    let that = this;
    if (this.debug) this.gui = new dat.GUI();
    this.settings = { progress: 0.5 };
    // if(this.debug) this.gui.add(this.settings, "progress", 0, 1, 0.01);

    Object.keys(this.uniforms).forEach(item => {
      this.settings[item] = this.uniforms[item].value;
      if (this.debug)
        this.gui.add(
          this.settings,
          item,
          this.uniforms[item].min,
          this.uniforms[item].max,
          0.01
        );
    });
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    // image cover
    this.imageAspect = this.slides[0].image.height / this.slides[0].image.width;
    let a1;
    let a2;
    const dist = this.camera.position.z;
    const height = 1;
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * dist));

    if (this.height / this.width > this.imageAspect) {
      // this.plane.scale.y = this.camera.aspect;
      this.plane.scale.x = this.plane.scale.y / this.imageAspect;
    } else {
      this.plane.scale.x = this.camera.aspect;
      this.plane.scale.y = this.plane.scale.x * this.imageAspect;
    }

    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        progress: { type: "f", value: 0 },
        border: { type: "f", value: 0 },
        intensity: { type: "f", value: 0.02 },
        scaleX: { type: "f", value: 40 },
        scaleY: { type: "f", value: 40 },
        transition: { type: "f", value: 40 },
        swipe: { type: "f", value: 0 },
        width: { type: "f", value: 0 },
        radius: { type: "f", value: 0 },

        slide1: { type: "f", value: this.slides[0] },
        slide2: { type: "f", value: this.slides[1] },

        alpha1: { type: "f", value: this.alphas[0] },
        alpha2: { type: "f", value: this.alphas[1] },

        displacement: {
          type: "f",
          value: new THREE.TextureLoader().load("img/disp6.jpg")
        },
        uMouse: { type: "v2", value: new THREE.Vector2(0, 0) },
        resolution: { type: "v4", value: new THREE.Vector4() }
      },
      // wireframe: true,
      vertexShader: this.vertex,
      fragmentShader: this.fragment
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 2, 2);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  stop() {
    this.paused = true;
  }

  play() {
    this.paused = false;
    this.render();
  }

  next() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(this.current);

    let len = this.slides.length;
    let nextSlide = this.slides[(this.current + 1) % len];
    let nextAlpha = this.alphas[(this.current + 1) % len];

    this.material.uniforms.slide2.value = nextSlide;
    this.material.uniforms.alpha2.value = nextAlpha;

    let tl = new TimelineMax();
    tl.to(this.material.uniforms.progress, this.duration, {
      value: 1,
      ease: Power2[this.easing],
      onComplete: () => {
        console.log("FINISH");
        this.current = (this.current + 1) % len;
        this.material.uniforms.slide1.value = nextSlide;
        this.material.uniforms.alpha1.value = nextAlpha;

        this.material.uniforms.progress.value = 0;
        this.isRunning = false;
      }
    });
  }
  render() {
    if (this.paused) return;
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    // this.material.uniforms.progress.value = this.settings.progress;

    // inertia
    this.mouseX += (this.mouseTargetX - this.mouseX) * 0.05;
    this.mouseY += (this.mouseTargetY - this.mouseY) * 0.05;

    // console.log(this.mouseX, this.mouseY);
    this.material.uniforms.uMouse.value.x = this.mouseX;
    this.material.uniforms.uMouse.value.y = this.mouseY;

    Object.keys(this.uniforms).forEach(item => {
      this.material.uniforms[item].value = this.settings[item];
    });

    // this.camera.position.z = 3;
    // this.plane.rotation.y = 0.4*Math.sin(this.time)
    // this.plane.rotation.x = 0.5*Math.sin(0.4*this.time)

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}
