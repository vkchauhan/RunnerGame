package com.example.bazaardash.models

import android.graphics.Canvas
import android.graphics.Rect

class Obstacle(val type: String, var lane: Int) {
    var y = -100f
    private val bounds = Rect()
    private val speed = 15f

    fun update() {
        y += speed
    }

    fun isOffScreen(): Boolean = y > 2000f

    fun draw(canvas: Canvas) {
        // Draw based on type: obstacle_cow, obstacle_rickshaw, etc.
    }

    fun getCollisionBounds(): Rect {
        val x = (lane * 300 + 200).toFloat()
        bounds.set(x.toInt(), y.toInt(), (x + 100).toInt(), (y + 100).toInt())
        return bounds
    }
}
