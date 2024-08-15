class Physics {
  constructor(length, width, height, mass) {
    this.length = length;
    this.width = width;
    this.height = height;
    this.mass = mass;
    this.gravity = 9.81;
    this.waterDensity = 1000; // كثافة الماء
    this.airDensity = 1.225; // كثافة الهواء
    this.dragCoefficientWater = 0.47; // معامل السحب في الماء
    this.dragCoefficientAir = 0.3; // معامل السحب في الهواء (قيمة تقريبية)
    this.velocity = 0; // السرعة الابتدائية للقارب

    // القيم الافتراضية لقوة الدفع
    this.thrustForce = 0;
    this.angularVelocity = 0;
    this.angularAcceleration = 0;
    this.rotationAngle = 0; // زاوية الدوران

  }

  // حساب الحجم المغمور بناءً على قوة الطفو
  getSubmergedHeight() {
    const buoyantForce = this.mass * this.gravity;

    // حجم الجزء المغمور من القارب
    const submergedVolume = buoyantForce / (this.waterDensity * this.gravity);

    // ارتفاع الجزء المغمور من القارب
    const submergedHeight = submergedVolume / (this.length * this.width);
    return submergedHeight;
  }

  updateParams(length, width, height, mass) {
    this.length = length;
    this.width = width;
    this.height = height;
    this.mass = mass;
  }
  
  updateRotationAngle(angle) {
    this.rotationAngle = angle;
  }

  // حساب المساحة العرضية المغمورة بناءً على ارتفاع الجزء المغمور
  getCrossSectionalAreaWater() {
    const submergedHeight = this.getSubmergedHeight();
    return this.width * submergedHeight;
  }

  // حساب المساحة العرضية المكشوفة لمقاومة الهواء
  getCrossSectionalAreaAir() {
    const submergedHeight = this.getSubmergedHeight();
    const exposedHeight = this.height - submergedHeight;
    return this.width * exposedHeight;
  }

  // حساب مقاومة الماء
  calculateWaterDrag() {
    const crossSectionalAreaWater = this.getCrossSectionalAreaWater();
    return 0.5 * this.waterDensity * this.dragCoefficientWater * crossSectionalAreaWater * Math.pow(this.velocity, 2);
  }

  // حساب مقاومة الهواء
  calculateAirDrag() {
    const crossSectionalAreaAir = this.getCrossSectionalAreaAir();
    return 0.5 * this.airDensity * this.dragCoefficientAir * crossSectionalAreaAir * Math.pow(this.velocity, 2);
  }

  // حساب قوة السحب الكلية
  calculateTotalDragForce() {
    const waterDrag = this.calculateWaterDrag();
    const airDrag = this.calculateAirDrag();
    return waterDrag + airDrag;
  }

  // حساب قوة الدفع
  calculateThrustForce(rpm) {
    console.log(`rpm from the method ${rpm}`)
    const torqueMap = {
      500: 50,
      2000: 300,
      5000: 500,
      7000: 200,
    };

    const torque = torqueMap[rpm] || 0;
    const k1 = 20;
    const k2 = 2;
    const k3 = 0.1;
    const initialAngularVelocity = (rpm * 2 * Math.PI) / 60;

    const netTorque = torque - k1 - k2 * initialAngularVelocity - k3 * this.angularAcceleration;

    this.angularAcceleration = netTorque / 18.5;
    this.angularVelocity = initialAngularVelocity + this.angularAcceleration;

    const efficiencyMap = {
      500: 0.8,
      2000: 0.9,
      5000: 0.5,
      7000: 0.2,
    };

    const efficiency = efficiencyMap[rpm] || 0;
    const displacementFactor = 1.9;
    const d = 1; // عامل الإزاحة

    const thrustX = 0; // عند زاوية 0
    const thrustY = -1 * displacementFactor * efficiency * this.angularVelocity;
    this.thrustForce = Math.sqrt(thrustX ** 2 + thrustY ** 2);
  }

  // حساب سرعة القارب الجديدة بناءً على قوة الدفع
  updateVelocity() {
    const dragForce = this.calculateTotalDragForce();
    const netForce = this.thrustForce - dragForce;
    const acceleration = netForce / this.mass;
    this.velocity += acceleration * 0.1; // نفترض تزايد السرعة بشكل تدريجي
  }

  isSinking() {
    const submergedHeight = this.getSubmergedHeight();
    return submergedHeight >= this.height;
  }
}

export default Physics;
