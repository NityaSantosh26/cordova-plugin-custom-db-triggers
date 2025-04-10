#import <Cordova/CDV.h>

@interface SQLiteTriggers : CDVPlugin
@end

@implementation SQLiteTriggers

- (void)pluginInitialize {
    // Delay in seconds to ensure plugin initialization (equivalent to Android's 1.5s)
    static const NSTimeInterval INIT_DELAY_SECONDS = 1.5;
    
    // Schedule the initialization on the main thread after delay
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(INIT_DELAY_SECONDS * NSEC_PER_SEC)),
                  dispatch_get_main_queue(), ^{
        // JavaScript code to check for the existence of SQLiteTriggers object and call its method
        NSString *JS_CHECK_AND_EXECUTE = @"if (window.sqliteTriggers && typeof sqliteTriggers.updateAppStateAndCreateTriggers === 'function') {"
                           "    sqliteTriggers.updateAppStateAndCreateTriggers();"
                           "} else {"
                           "    console.error('SQLiteTriggers not available in JS context');"
                           "}";
        
        // Execute the JavaScript code
        if (self.webView != nil) {
            [self.webViewEngine evaluateJavaScript:JS_CHECK_AND_EXECUTE completionHandler:^(id result, NSError *error) {
                if (error) {
                    NSLog(@"[SQLiteTriggers] Error executing JavaScript: %@", error.localizedDescription);
                } else {
                    NSLog(@"[SQLiteTriggers] Trigger initialization executed");
                }
            }];
        } else {
            NSLog(@"[SQLiteTriggers] WebView is nil during plugin initialization");
        }
    });
}

@end
