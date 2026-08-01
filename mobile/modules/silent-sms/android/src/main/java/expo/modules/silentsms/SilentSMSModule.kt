package expo.modules.silentsms

import android.Manifest
import android.content.pm.PackageManager
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class SilentSMSModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SilentSMS")

    AsyncFunction("isAvailable") { promise: Promise ->
      try {
        val hasPermission = ContextCompat.checkSelfPermission(
          appContext.reactContext!!,
          Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED

        promise.resolve(hasPermission)
      } catch (e: Exception) {
        promise.resolve(false)
      }
    }

    AsyncFunction("sendSMS") { phoneNumber: String, message: String, promise: Promise ->
      try {
        // Check permission
        val hasPermission = ContextCompat.checkSelfPermission(
          appContext.reactContext!!,
          Manifest.permission.SEND_SMS
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasPermission) {
          promise.reject("PERMISSION_DENIED", "SEND_SMS permission not granted", null)
          return@AsyncFunction
        }

        // Send SMS silently
        val smsManager = SmsManager.getDefault()
        
        // Split message if too long (160 chars limit)
        val parts = smsManager.divideMessage(message)
        
        if (parts.size == 1) {
          smsManager.sendTextMessage(phoneNumber, null, message, null, null)
        } else {
          smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
        }

        promise.resolve(mapOf(
          "success" to true,
          "phoneNumber" to phoneNumber,
          "parts" to parts.size
        ))
      } catch (e: Exception) {
        promise.reject("SMS_SEND_FAILED", e.message ?: "Failed to send SMS", e)
      }
    }
  }
}
