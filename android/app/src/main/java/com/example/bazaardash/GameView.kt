package com.example.bazaardash

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.example.bazaardash.models.Player
import com.example.bazaardash.models.Obstacle

class GameView(context: Context) : SurfaceView(context), SurfaceHolder.Callback {
    private var gameLoop: GameLoop? = null
    var onGameOverListener: (() -> Unit)? = null

    private val player = Player()
    private val obstacles = mutableListOf<Obstacle>()
    private val inputHandler = InputHandler(player)

    init {
        holder.addCallback(this)
        isFocusable = true
        setOnTouchListener(inputHandler)
    }

    override fun surfaceCreated(holder: SurfaceHolder) {
        gameLoop = GameLoop(this, holder)
        gameLoop?.startLoop()
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {}

    override fun surfaceDestroyed(holder: SurfaceHolder) {
        gameLoop?.stopLoop()
    }

    fun update() {
        player.update()
        // Update obstacles and check collisions
        val iterator = obstacles.iterator()
        while (iterator.hasNext()) {
            val obs = iterator.next()
            obs.update()
            if (obs.isOffScreen()) {
                // Reuse or remove
            }
            if (player.getCollisionBounds().intersect(obs.getCollisionBounds())) {
                onGameOverListener?.invoke()
                gameLoop?.stopLoop()
            }
        }
    }

    override fun draw(canvas: Canvas) {
        super.draw(canvas)
        canvas.drawColor(Color.DKGRAY) // Bazaar background placeholder
        player.draw(canvas)
        for (obs in obstacles) {
            obs.draw(canvas)
        }
    }
}
