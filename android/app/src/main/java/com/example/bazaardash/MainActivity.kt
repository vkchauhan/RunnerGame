package com.example.bazaardash

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            var gameState by remember { mutableStateOf("MENU") }

            when (gameState) {
                "MENU" -> MainMenu { gameState = "PLAYING" }
                "PLAYING" -> GameScreen { gameState = "GAMEOVER" }
                "GAMEOVER" -> GameOverScreen { gameState = "PLAYING" }
            }
        }
    }
}

@Composable
fun MainMenu(onStart: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Bazaar Dash", style = MaterialTheme.typography.headlineLarge)
        Spacer(modifier = Modifier.height(20.dp))
        Button(onClick = onStart) {
            Text("Start Dash")
        }
    }
}

@Composable
fun GameScreen(onGameOver: () -> Unit) {
    AndroidView(
        factory = { context ->
            GameView(context).apply {
                this.onGameOverListener = onGameOver
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}

@Composable
fun GameOverScreen(onRestart: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Crashed!", style = MaterialTheme.typography.headlineLarge)
        Button(onClick = onRestart) {
            Text("Try Again")
        }
    }
}
