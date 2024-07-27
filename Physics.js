class Physics {
  constructor(length, width, height, mass) {
    this.length = length;
    this.width = width;
    this.height = height;
    this.mass = mass;
    this.gravity = 9.81;
  }

  // حساب الحجم المغمور بناءً على قوة الطفو
  getSubmergedHeight() {
    const volume = this.length * this.width * this.height;
    const buoyantForce = this.mass * this.gravity;
    const waterDensity = 1000; // كثافة الماء بالكيلوغرام/متر مكعب

    // حجم الجزء المغمور من القارب
    const submergedVolume = buoyantForce / (waterDensity * this.gravity);

    // ارتفاع الجزء المغمور من القارب
    const submergedHeight = submergedVolume / (this.length * this.width);
    console.log('submerged hieght'+submergedHeight)
    return submergedHeight;
  }

  updateParams(length, width, height, mass) {
    this.length = length;
    this.width = width;
    this.height = height;
    this.mass = mass;
  }

  isSinking() {
    const submergedHeight = this.getSubmergedHeight();
    return submergedHeight >= this.height;
  }
}

export default Physics;
