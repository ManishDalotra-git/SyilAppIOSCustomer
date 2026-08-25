#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "react/performance/cdpmetrics/CdpInteractionTypes.h"
#import "react/performance/cdpmetrics/CdpMetricsReporter.h"
#import "react/performance/cdpmetrics/CdpPerfIssuesReporter.h"

FOUNDATION_EXPORT double React_performancecdpmetricsVersionNumber;
FOUNDATION_EXPORT const unsigned char React_performancecdpmetricsVersionString[];

