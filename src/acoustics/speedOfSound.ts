/** Common linear approximation for dry air near room temperature. */
export const speedOfSound = (temperatureC: number) =>
  331.3 + 0.606 * temperatureC;

export const referenceSpeedOfSoundMps = speedOfSound(20);
