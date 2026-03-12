package com.example.bazaardash.models

import android.graphics.Canvas
import android.graphics.Rect

class Collectible(val type: String, var lane: Int) {
    var y = -100f
    private val bounds = Rect()

    fun update(speed: Float) {
        y += speed
    }

    fun draw(canvas: Canvas) {
        // Draw collect_samosa or powerup_chai
    }

    fun getCollisionBounds(): Rect {
        val x = (lane * 300 + 200).toFloat()
        bounds.set(x.toInt(), y.toInt(), (x + 80).toInt(), (y + 80).toInt())
        return bounds
    }
}
