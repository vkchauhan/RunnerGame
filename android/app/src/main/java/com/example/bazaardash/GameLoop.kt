package com.example.bazaardash

import android.view.SurfaceHolder

class GameLoop(private val gameView: GameView, private val surfaceHolder: SurfaceHolder) : Thread() {
    private var running = false
    private val targetFPS = 60.0
    private val targetTime = (1000 / targetFPS).toLong()

    fun startLoop() {
        running = true
        start()
    }

    fun stopLoop() {
        running = false
    }

    override fun run() {
        var startTime: Long
        var timeMillis: Long
        var waitTime: Long

        while (running) {
            startTime = System.currentTimeMillis()
            val canvas = surfaceHolder.lockCanvas()
            if (canvas != null) {
                synchronized(surfaceHolder) {
                    gameView.update()
                    gameView.draw(canvas)
                }
                surfaceHolder.unlockCanvasAndPost(canvas)
            }

            timeMillis = System.currentTimeMillis() - startTime
            waitTime = targetTime - timeMillis

            if (waitTime > 0) {
                try {
                    sleep(waitTime)
                } catch (e: Exception) {}
            }
        }
    }
}
