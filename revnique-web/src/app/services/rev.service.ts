import { Injectable, Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';



@Injectable()
export class RevService {
    urlRoot: string = location.href.indexOf('localhost:') > -1 ? 'http://localhost:47777/' : 'https://bucktrace.com/';
    svcRoot: string = location.href.indexOf('localhost:') > -1 ? 'http://localhost:57777/api/' : 'https://api.bucktrace.com/';
    constructor(private http: HttpClient) { }

    getProjects(SN: string): Observable<RevProject[]> {
        let p: RevProject[] = [
            {
                projectName: 'h1teq.com',
                projectComment: '',
                projectImage: '',
                projectUrl: 'https://h1teq.com'
            },
            {
                projectName: 'bucktrace.com',
                projectComment: '',
                projectImage: '',
                projectUrl: 'https://bucktrace.com'
            },
            {
                projectName: 'meridian',
                projectComment: '',
                projectImage: '',
                projectUrl: 'https://meridian.ui.h1teq.com/proof/detail/5a051eaa0dd7185b4c2e7a2f'
            },
        ];
        return of(p);
    };
}


export class RevProject {
    public projectName: string = '';
    public projectImage: string = '';
    public projectComment: string = '';
    public projectUrl: string = '';
}

