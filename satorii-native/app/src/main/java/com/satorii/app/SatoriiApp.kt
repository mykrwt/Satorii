package com.satorii.app

import android.app.Application
import androidx.room.Room
import com.satorii.app.repository.AppDatabase

class SatoriiApp : Application() {
    companion object {
        lateinit var database: AppDatabase
            private set
    }

    override fun onCreate() {
        super.onCreate()
        database = Room.databaseBuilder(
            this,
            AppDatabase::class.java,
            "satorii-db"
        )
        .fallbackToDestructiveMigration()
        .build()
    }
}
