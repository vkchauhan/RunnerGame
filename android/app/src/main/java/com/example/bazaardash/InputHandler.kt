package com.example.bazaardash

import android.view.GestureDetector
import android.view.MotionEvent
import android.view.View
import com.example.bazaardash.models.Player

class InputHandler(private val player: Player) : View.OnTouchListener {
    private val gestureDetector = GestureDetector(null, object : GestureDetector.SimpleOnGestureListener() {
        override fun onFling(e1: MotionEvent?, e2: MotionEvent, velocityX: Float, velocityY: Float): Boolean {
            val diffX = e2.x - (e1?.x ?: 0f)
            val diffY = e2.y - (e1?.y ?: 0f)
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 0 && player.lane < 2) player.lane++
                else if (diffX < 0 && player.lane > 0) player.lane--
            } else {
                if (diffY < 0) { /* Jump */ }
                else { /* Slide */ }
            }
            return true
        }
    })

    override fun onTouch(v: View?, event: MotionEvent?): Boolean {
        return gestureDetector.onTouchEvent(event!!)
    }
}
