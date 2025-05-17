namespace gdcMaqueen {

    enum motorState {
        STOP = 0,
        FORWARD = 1,
        BACKWARD = 2,
        LEFT = 3,
        RIGHT = 4,
        FOLLOW = 5
    }

    enum followDir {
        STRAIGHT = 0,
        LEFT = 1,
        RIGHT = 2
    }

    let stop_count = 0
    let motor_speed = 0
    let motor_calib = 0
    let motor_state = motorState.STOP
    let r_speed = 0
    let l_speed = 0
    let l_count = 0
    let r_count = 0
    let follow_ctrl = 0
    let motor_ctrl = 0
    let last_follow_dir = followDir.STRAIGHT

    follow_ctrl = 50
    motor_ctrl = 20
    motor_calib = 10

    //% block="set follow control $value"
    export function set_follow_control(value: number) {
        follow_ctrl = value
    }

    //% block="set motor control $value"
    export function set_motor_control(value: number) {
        motor_ctrl = value
    }

    //% block="set motor calibration $value"
    export function set_motor_calibration(value: number) {
        motor_calib = value
    }

    //% block="get motor state"
    export function get_motor_state(): motorState {
        return motor_state;
    }

    //% block="get motor $motor counter"
    export function get_motor_count(motor: maqueen.Motors) {
        if (motor == maqueen.Motors.M1)
            return l_count;
        else if(motor == maqueen.Motors.M2)
            return r_count;
        else
            return 0 
    }

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
        maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CCW, l_speed)
        maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CCW, r_speed + motor_calib)
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
        r_count = 0
        l_count = 0
        maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CCW, speed)
        maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CW, speed + motor_calib)
        stop_count = rotations * 24
        motor_state = motorState.LEFT
    }

    //% block="move forward at $speed for $rotations rotations"
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
        maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CW, l_speed)
        maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CW, r_speed + motor_calib)
    }

    //% block="turn right at $speed for $rotations rotations"
    //% speed.defl=50
    //% rotations.defl=1
    export function turn_right(speed: number, rotations: number) {
        r_count = 0
        l_count = 0
        maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CW, speed)
        maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CCW, speed + motor_calib)
        stop_count = rotations * 24
        motor_state = motorState.RIGHT
    }

    //% block="follow line at $speed for $rotations"
    //% speed.defl=200
    //% rotations.defl=10
    export function follow_line(speed: number, rotations: number) {
        r_count = 0
        l_count = 0
        motor_state = motorState.FOLLOW
        motor_speed = speed
        l_speed = speed
        r_speed = speed
        stop_count = rotations * 24

        maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CW, l_speed)
        maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CW, r_speed + motor_calib)
    }

    function stop_count_reached(motor: maqueen.Motors) {
        if (motor == maqueen.Motors.M1)
            return l_count >= stop_count;
        else if (motor == maqueen.Motors.M2)
            return r_count >= stop_count;
        else
            return (l_count >= stop_count) && (r_count >= stop_count)
    }

    // background task to monitor and contrl motor movement
    basic.forever(function () {
        if (motor_state > motorState.STOP && motor_state < motorState.LEFT) {
            if (l_count > r_count) {
                r_speed = motor_speed + motor_ctrl
                l_speed = motor_speed
                basic.showLeds(`
    . . # . .
    . . . # .
    # # # # #
    . . . # .
    . . # . .
    `)

            } else if (l_count < r_count) {
                r_speed = motor_speed
                l_speed = motor_speed + motor_ctrl
                basic.showLeds(`
    . . # . .
    . # . . .
    # # # # #
    . # . . .
    . . # . .
    `)
                } else {
                r_speed = motor_speed
                l_speed = motor_speed
                basic.showLeds(`
    . . # . .
    . # . # .
    # . . . #
    . # . # .
    . . # . .
    `)
            }

            if (stop_count_reached(maqueen.Motors.All)) {
                motor_state = motorState.STOP
                motor_speed = 0
                maqueen.motorStop(maqueen.Motors.All)
            } else {
                if (motor_state == motorState.FORWARD) {
                    maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CW, l_speed)
                    maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CW, r_speed + motor_calib)
                } else if (motor_state == motorState.BACKWARD) {
                    maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CCW, l_speed)
                    maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CCW, r_speed + motor_calib)
                }
            }
        } else if (motor_state == motorState.LEFT || motor_state == motorState.RIGHT) {
            if (stop_count_reached(maqueen.Motors.M1)) {
                maqueen.motorStop(maqueen.Motors.M1)
            }
            if (stop_count_reached(maqueen.Motors.M2)) {
                maqueen.motorStop(maqueen.Motors.M2)
            }
            if (stop_count_reached(maqueen.Motors.All)) {
                motor_state = motorState.STOP
            }
        } else if (motor_state == motorState.FOLLOW) {
            let l = maqueen.readPatrol(maqueen.Patrol.PatrolLeft)
            let r = maqueen.readPatrol(maqueen.Patrol.PatrolRight)

            // both on the line
            if ((l == 1) && (r == 1)) {
                l_speed = motor_speed
                r_speed = motor_speed
                last_follow_dir = followDir.STRAIGHT
            } else if ((l == 1) && (r == 0)) { // only left on the line - turn left
                l_speed = motor_speed - follow_ctrl
                r_speed = motor_speed
                last_follow_dir = followDir.LEFT
            } else if ((l == 0) && (r == 1)) { // only right on the line - turn right
                l_speed = motor_speed
                r_speed = motor_speed - follow_ctrl
                last_follow_dir = followDir.RIGHT
            } else { // both off the line -- turn opposite from last direction
                if (last_follow_dir == followDir.LEFT) {
                    l_speed = motor_speed
                    r_speed = motor_speed - follow_ctrl
                } else if (last_follow_dir == followDir.RIGHT) {
                    l_speed = motor_speed - follow_ctrl
                    r_speed = motor_speed
                }
            }
            // set motor speed
            maqueen.motorRun(maqueen.Motors.M1, maqueen.Dir.CW, l_speed)
            maqueen.motorRun(maqueen.Motors.M2, maqueen.Dir.CW, r_speed + motor_calib)

            if (stop_count_reached(maqueen.Motors.All)) {
                maqueen.motorStop(maqueen.Motors.All)
                motor_state = motorState.STOP
            }
        } else {
            basic.pause(100)
        }
    })
}
