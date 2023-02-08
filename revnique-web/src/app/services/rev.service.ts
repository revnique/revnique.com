import { Injectable, Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';



@Injectable()
export class RevService {
    urlRoot: string = location.href.indexOf('localhost:') > -1 ? 'http://localhost:47777/' : 'https://bucktrace.com/';
    svcRoot: string = location.href.indexOf('localhost:') > -1 ? 'http://localhost:57777/api/' : 'https://api.bucktrace.com/';
    constructor(private http: HttpClient) { }

    getProjects(): Observable<RevProject[]> {
        let p: RevProject[] = [
            {
                name: 'h1teq.com',
                comment: 'h1 teq llc homepage',
                image: '../../assets/images/rev_h1teq.png',
                projectUrl: 'https://h1teq.com',
                techList: ['responsive web', 'dynamic pdf creation', 'HTML', 'CSS']
            },
            {
                name: 'bucktrace.com',
                comment: 'a currency tracking application',
                image: '../../assets/images/rev_bucktrace.png',
                projectUrl: 'https://bucktrace.com/trace/K77777777*',
                techList: ['flutter', 'iOS', 'Android', 'node.js', 'AWS Lambda', 'mongoDb', 'Angular 14', 'React 18', 'SASS', 'AWS']
            },
            {
                name: 'meridian',
                comment: 'peer to peer proof review system',
                image: '../../assets/images/rev_meridian.png',
                projectUrl: 'https://meridian.ui.h1teq.com/proof/detail/5a051eaa0dd7185b4c2e7a2f',
                techList: ['Angular 4', 'web sockets', '.Net Core', 'C#']
            },
        ];
        return of(p);
    };
}


export class RevProject {
    public name: string = '';
    public image: string = '';
    public comment: string = '';
    public projectUrl: string = '';
    public techList: string[] = [];
}

