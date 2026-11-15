export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
export function stepSpring(state, parameters, dt) {
	const acceleration =
		(-parameters.stiffness * (state.x - state.target) - parameters.damping * state.velocity) /
		parameters.mass
	state.velocity += acceleration * dt
	state.x += state.velocity * dt
	const minimum = state.minimum ?? -1.1
	const maximum = state.maximum ?? 1.1
	if (state.x < minimum || state.x > maximum) {
		state.x = clamp(state.x, minimum, maximum)
		state.velocity *= -0.35
	}
	return state
}
export const dampingRatio = parameters =>
	parameters.damping / (2 * Math.sqrt(parameters.stiffness * parameters.mass))
