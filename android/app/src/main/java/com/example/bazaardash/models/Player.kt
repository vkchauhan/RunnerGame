package com.example.bazaardash.models

import android.graphics.Canvas
import android.graphics.Rect

class Player {
    var lane = 1 // 0, 1, 2
    var y = 1500f
    var x = 500f
    private val bounds = Rect()

    fun update() {
        // Smooth lane transition logic
        val targetX = (lane * 300 + 200).toFloat()
        x += (targetX - x) * 0.2f
    }

    fun draw(canvas: Canvas) {
        // Use player_run_sheet, player_jump, player_slide
    }

    fun getCollisionBounds(): Rect {
        bounds.set(x.toInt(), y.toInt(), (x + 100).toInt(), (y + 150).toInt())
        return bounds
    }
}
