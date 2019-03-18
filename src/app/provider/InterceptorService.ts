import { Injectable, Injector } from '@angular/core';
import {
    HttpInterceptor, HttpRequest, HttpHandler, HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Message } from '@dso/core';
import { mergeMap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class InterceptorService implements HttpInterceptor {
    constructor(
        private injector: Injector
    ) { }

    private goLogin() {
        const router = this.injector.get(Router);
        router.navigate(['/login']);
    }

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler,
    ): Observable<any> {
        const message = this.injector.get(Message);
        return next.handle(req).pipe(
            mergeMap((event: any) => {
                // 服务器接口返回数据处理
                if (event instanceof HttpResponse && event.status === 200) {
                    if (event.body.code === 0) {
                        event = event.clone({ body: event.body.data || {} });
                    } else if (event.body.code === 9) {
                        event = event.clone({ body: event.body || {} });
                    } else if (event.body.code > 0) {
                        const msg = event.body.msg;
                        if (msg) { message.error(msg); }
                        event = event.clone({ body: false });
                    }
                }
                return Observable.create(observer => observer.next(event));
            }),
            catchError((res) => {
                // 业务处理：一些通用操作
                switch (res.status) {
                    case 401: // 未登录状态码
                        this.goLogin();
                        break;
                    case 200:
                        // 业务层级错误处理
                        console.log('业务错误');
                        break;
                    case 404:
                        message.error(res.statusText);
                        break;
                    default:
                        message.error(res.statusText);
                }
                // 以错误的形式结束本次请求
                return of(res);
            })
        );
    }
}