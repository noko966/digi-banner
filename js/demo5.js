let sketch = new Sketch({
  debug: true,
  uniforms: {
    intensity: { value: 0.3, type: "f", min: 0, max: 2 }
  },
  fragment: `
		uniform float time;
		uniform float progress;
		uniform float width;
		uniform float scaleX;
		uniform float scaleY;
		uniform float transition;
		uniform float radius;
		uniform float intensity;

		uniform sampler2D slide1;
		uniform sampler2D slide2;

		uniform sampler2D alpha1;
		uniform sampler2D alpha2;

		
		uniform sampler2D displacement;
		uniform vec4 resolution;
		uniform vec2 uMouse;
		varying vec2 vUv;
		
		float random (in vec2 st) {
			return fract(sin(dot(st.xy,
								 vec2(12.9898,78.233)))
						 * 43758.5453123);
		}

		float noise (in vec2 st) {
			vec2 i = floor(st);
			vec2 f = fract(st);
		
			float a = random(i);
			float b = random(i + vec2(1.0, 0.0));
			float c = random(i + vec2(0.0, 1.0));
			float d = random(i + vec2(1.0, 1.0));
		
		
			vec2 u = f*f*(3.0-2.0*f);
			u = smoothstep(0.,1.,f);
		
			return mix(a, b, u.x) +
					(c - a)* u.y * (1.0 - u.x) +
					(d - b) * u.x * u.y;
		}

		vec2 mirrored(vec2 v) {
			vec2 m = mod(v,2.);
			return mix(m,2.0 - m, step(1.0 ,m));
		  }



		void main()	{
			
			vec2 ppp = vec2(vUv);
			float n = random(ppp) * 0.01;
	
			vec4 d1 = texture2D(displacement, vUv);

			float displace = (d1.r + d1.g + d1.b)*0.33;

			vec4 depth1 = texture2D(alpha1, vec2(vUv.x +  (progress / 10.), vUv.y));
			vec4 depth2 = texture2D(alpha2, vec2(vUv.x +  (1. - progress )/ 10., vUv.y));

			float blur1 = (n + random(vec2(n,n+1.)) * 0.3) * progress / 10.;
			float blur2 = (n + random(vec2(n,n+1.)) * 0.3) * (1.-progress) / 10.;

			vec2 myMouse = vec2(uMouse.x * 0.01 + sin(time) * 0.0025, uMouse.y * 0.01);

			vec4 s1 = texture2D(slide1, vec2((vUv.x + blur1 + myMouse.x * (depth1.r - 0.5))  +  progress / 10. * (displace * intensity) , vUv.y + myMouse.y * (depth1.r - 0.5)));
			vec4 s2 = texture2D(slide2, vec2((vUv.x + blur2 + myMouse.x * (depth2.r - 0.5))  + (1. - progress) / 10. * (displace * intensity) , vUv.y + myMouse.y * (depth2.r - 0.5)));

	
			gl_FragColor = mix(s1, s2, progress);

		}

	`
});
