import urllib.request, re
html = urllib.request.urlopen('https://itako-plaza.vercel.app/').read().decode()
js_url_match = re.search(r'"(/assets/index-.*?\.js)"', html)
if js_url_match:
    js_url = js_url_match.group(1)
    js_code = urllib.request.urlopen('https://itako-plaza.vercel.app' + js_url).read().decode()
    if '/api/streamChat' in js_code:
        print("SUCCESS! /api/streamChat is natively compiled into the frontend JS.")
    else:
        print("FAIL! /api/streamChat is NOT in the JS file!")
else:
    print("Could not parse index JS path.")
