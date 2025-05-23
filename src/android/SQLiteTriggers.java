package com.example;

import java.util.logging.Handler;

import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;

import android.os.Looper;
import android.util.Log;

/**
 * SQLiteTriggers is a Cordova plugin that initializes SQLite triggers for
 * handling session data.
 * It ensures that triggers are created after the app's database setup is
 * complete.
 */
public class SQLiteTriggers extends CordovaPlugin {
  private static final String TAG = "SQLiteTriggers";
  private static final int INIT_DELAY_MS = 1500; // Delay in milliseconds to ensure plugin initialization

  /**
   * Initializes the SQLite triggers plugin.
   * This method is called when the plugin is loaded.
   * It waits for a short delay to ensure that the Cordova environment is fully
   * initialized before attempting to execute JavaScript code.
   */
  @Override
  public void initialize(final CordovaInterface cordova, final CordovaWebView webView) {
    super.initialize(cordova, webView);
    System.out.println("CheckTheOrder2");
    // Use a Handler to post a delayed task on the main thread
    new Handler(Looper.getMainLooper()).postDelayed(() -> {
      // Ensure that the code runs on the UI thread
      cordova.getActivity().runOnUiThread(() -> {
        try {
          // JavaScript code to check for the existence of the SQLiteTriggers object and
          // call its method
          final String JS_CHECK_AND_EXECUTE = "if (window.sqliteTriggers && typeof sqliteTriggers.updateAppState === 'function') { "
              +
              "  sqliteTriggers.updateAppState(); " +
              "} else { " +
              "  console.error('SQLiteTriggers not available in JS context'); " +
              "}";

          // Check if the WebView is available before executing JavaScript
          System.out.println("CheckTheOrder3");
          if (webView != null) {
            // Load the JavaScript code into the WebView
            webView.loadUrl("javascript:" + JS_CHECK_AND_EXECUTE);
            Log.d(TAG, "Trigger initialization executed");
          } else {
            Log.e(TAG, "WebView is null during plugin initialization");
          }
        } catch (Exception e) {
          // Log any exceptions that occur during initialization
          Log.e(TAG, "Error initializing triggers: " + e.getMessage());
        }
      });
    }, INIT_DELAY_MS);
  }
}
