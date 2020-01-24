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



		void main()	{
			
			vec2 ppp = vec2(vUv);
			float n = noise(ppp);
	
			vec4 d1 = texture2D(displacement, vUv);

			float displace = (d1.r + d1.g + d1.b)*0.33;

			float smallProgress = progress * 0.1;
			float smallProgressNegative = (1. - progress) * 0.1;

			vec4 depth1 = texture2D(alpha1, vUv);
			vec4 depth2 = texture2D(alpha2, vUv);


			vec2 myMouse = vec2(uMouse.x * 0.01, uMouse.y * 0.01);

			vec4 s1 = texture2D(slide1, vec2((vUv.x + myMouse.x * depth1.r) +  progress * (displace * intensity) , vUv.y + myMouse.y * depth1.r));
			vec4 s2 = texture2D(slide2, vec2((vUv.x + myMouse.x * depth2.r) + (1. - progress) * (displace * intensity) , vUv.y + myMouse.y * depth2.r));


			gl_FragColor = mix(s1, s2, progress);

		}

	`
});

let ss = `
void main()	{
			
	vec4 d1 = texture2D(displacement, vUv);

			float displace1 = (d1.r + d1.g + d1.b)*0.33;

			vec4 depth1 = texture2D(alpha1, vUv);
			vec4 depth2 = texture2D(alpha2, vUv);
			vec2 u_uv = vUv;

			vec4 t1 = texture2D(slide1, vec2(vUv.x + uMouse.x * depth1.r * 0.01 * (displace1 * intensity) , vUv.y + uMouse.y * depth1.r * 0.01));
			vec4 t2 = texture2D(slide2, vec2(vUv.x + uMouse.x * depth2.r * 0.01 * (displace1 * intensity) , vUv.y + uMouse.y * depth2.r * 0.01));
		
			 
			gl_FragColor = mix(t1, t2, progress);

}



void main()	{

	vec2 newUV = (vUv - vec2(0.5))*resolution.zw + vec2(0.5);

	vec4 d1 = texture2D(displacement, newUV);

	float displace1 = (d1.r + d1.g + d1.b)*0.33;

	vec4 depth1 = texture2D(alpha1, newUV);
	vec4 depth2 = texture2D(alpha2, newUV);

	vec4 t1 = texture2D(slide1, newUV + uMouse * 0.01 * depth1.r + sin(time) * 0.001 + progress * 0.1 * (displace1 * intensity));
	vec4 t2 = texture2D(slide2, newUV + uMouse * 0.01 * depth2.r + sin(time) * 0.001 + (1.0 - progress) * 0.1 * (displace1 * intensity));
	
	gl_FragColor = texture2D(slide1, newUV);

}


`;
