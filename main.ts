namespace gdcMaqueen {

    enum motorState {
        STOP = 0,
        FORWARD = 1,
        BACKWARD = 2,
        LEFT = 3,
        RIGHT = 4
    }

    let stop_count = 0
    let motor_speed = 0
    let motor_state = motorState.STOP
    let r_speed = 0
    let l_speed = 0
    let l_count = 0
    let r_count = 0

    //% block="open claw"
    export function open_claw() {
        maqueen.servoRun(maqueen.Servos.S1, 60)
    }
    
    //% block="close claw"
    export function close_claw() {
        maqueen.servoRun(maqueen.Servos.S1, 10)
    }

    //% block="move backward at $speed for $rotations rotations"
    //% speed.defl=200
    //% rotations.defl=1
    export function backward(speed: number, rotations: number) {
        r_count = 0
        l_count = 0
        l_speed = speed
        r_speed = speed
        motor_state = motorState.BACKWARD
        motor_speed = speed
        stop_count = rotations * 24
        maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CCW, speed)
        maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CCW, speed)
    }

    // Monitor right motor encoder
    pins.onPulsed(DigitalPin.P1, PulseValue.High, function () {
        if (motor_state > motorState.STOP) {
            r_count += 1
        }
    })

    // Monitor left motor encoder
    pins.onPulsed(DigitalPin.P0, PulseValue.High, function () {
        if (motor_state > motorState.STOP) {
            l_count += 1
        }
    })

    //% block="wait movement done"
    export function wait_movement_done() {
        while (motor_state > motorState.STOP) {
            basic.pause(100)
        }
    }
    
    //% block="turn left at $speed for $rotations rotations"
    //% speed.defl=50
    //% rotations.defl=1
    export function turn_left(speed: number, rotations: number) {
        maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CCW, speed)
        maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CW, speed)
        stop_count = rotations * 24
        motor_state = motorState.LEFT
    }

    //% block="move forward left at $speed for $rotations rotations"
    //% speed.defl=200
    //% rotations.defl=1
    export function forward(speed: number, rotations: number) {
        r_count = 0
        l_count = 0
        l_speed = speed
        r_speed = speed
        motor_state = motorState.FORWARD
        motor_speed = speed
        stop_count = rotations * 24
        maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CW, speed)
        maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CW, speed)
    }

    //% block="turn right at $speed for $rotations rotations"
    //% speed.defl=50
    //% rotations.defl=1
    function turn_right(speed: number, rotations: number) {
        maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CW, speed)
        maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CCW, speed)
        stop_count = rotations * 24
        motor_state = motorState.RIGHT
    }

    // background task to monitor and contrl motor movement
    basic.forever(function () {
        if (motor_state > motorState.STOP && motor_state < motorState.LEFT) {
            if (l_count > r_count + 10) {
                r_speed += 1
                l_speed += -1
                if (l_speed < motor_speed - 20) {
                    l_speed = motor_speed - 20
                }
                if (r_speed > motor_speed + 20) {
                    r_speed = motor_speed + 20
                }
            } else if (l_count < r_count - 10) {
                r_speed += -1
                l_speed += 1
                if (l_speed > motor_speed + 20) {
                    l_speed = motor_speed + 20
                }
                if (r_speed < motor_speed - 20) {
                    r_speed = motor_speed + 20
                }
            }
            if (l_count >= stop_count || r_count >= stop_count) {
                motor_state = motorState.STOP
                motor_speed = 0
                maqueen.motorStop(maqueen.Motors.All)
            } else {
                if (motor_state == motorState.FORWARD) {
                    maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CW, l_speed)
                    maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CW, r_speed)
                } else if (motor_state == motorState.BACKWARD) {
                    maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CCW, l_speed)
                    maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CCW, r_speed)
                }
            }
        } else if (motor_state == motorState.LEFT || motor_state == motorState.RIGHT) {
            if (l_count >= stop_count) {
                maqueen.motorStop(maqueen.Motors.M1)
            }
            if (r_count >= stop_count) {
                maqueen.motorStop(maqueen.Motors.M2)
            }
            if (l_count >= stop_count && r_count >= stop_count) {
                motor_state = motorState.STOP
            }
        } else {
            basic.pause(100)
        }
    })
}
