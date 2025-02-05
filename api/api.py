from flask import Flask, request, jsonify
from bs4 import BeautifulSoup
import requests
from urllib.parse import urljoin
from flask_cors import CORS
import time
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

app = Flask(__name__)
CORS(app)

@app.route('/api/scan', methods=['POST'])
def scan():
    data = request.get_json()
    url = data.get('url')
    scan_type = data.get('scanType')
    email = data.get('email')

    if url and scan_type:
        if scan_type == 'sql':
            result = sql_injection_scan(url)
        elif scan_type == 'xss':
            result = xss_scan(url)
        else:
            return jsonify({'error': 'Invalid scan type'})

        # Store the URL and email in MongoDB
        try:
            client = MongoClient('mongodb://localhost:27017/')
            db = client['vulnerability_scanner']
            collection = db['scans']

            scan_data = {'url': url, 'email': email}
            collection.insert_one(scan_data)
        except ConnectionFailure:
            return jsonify({'error': 'Failed to connect to MongoDB'})

        return jsonify({'result': result})
    else:
        return jsonify({'error': 'Invalid payload'})

def get_forms(url):
    s = requests.Session()
    s.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36"
    soup = BeautifulSoup(s.get(url).content, "html.parser")
    return soup.find_all("form")

def form_details(form):
    detailsOfForm = {}
    action = form.attrs.get("action")
    method = form.attrs.get("method", "get")
    inputs = []

    for input_tag in form.find_all("input"):
        input_type = input_tag.attrs.get("type", "text")
        input_name = input_tag.attrs.get("name")
        input_value = input_tag.attrs.get("value", "")
        inputs.append({
            "type": input_type,
            "name" : input_name,
            "value" : input_value,
        })

    detailsOfForm['action'] = action
    detailsOfForm['method'] = method
    detailsOfForm['inputs'] = inputs
    return detailsOfForm

def vulnerable(response):
    errors = {"quoted string not properly terminated",
              "unclosed quotation mark after the character string",
              "you have an error in your SQL syntax"
             }
    for error in errors:
        if error in response.content.decode().lower():
            return True
    return False

def sql_injection_scan(url):
    forms = get_forms(url)
    results = []

    start_time = time.time()
    timeout = 30  # 300 seconds

    for form in forms:
        details = form_details(form)
        for i in "\"'":
            data = {}
            for input_tag in details["inputs"]:
                if input_tag["type"] == "hidden" or input_tag["value"]:
                    data[input_tag['name']] = input_tag["value"] + i
                elif input_tag["type"] != "submit":
                    data[input_tag['name']] = f"test{i}"

            if details["method"] == "post":
                res = requests.post(url, data=data)
            elif details["method"] == "get":
                res = requests.get(url, params=data)

            if vulnerable(res):
                result = {'url': url, 'form_details': details}
                results.append(result)

            elapsed_time = time.time() - start_time
            if elapsed_time >= timeout:
                break

    return results

def xss_scan(url):
    forms = get_forms(url)
    results = []

    for form in forms:
        details = form_details(form)
        for input_tag in details["inputs"]:
            if input_tag["type"] != "submit":
                data = {
                    input_tag["name"]: '<script>alert("XSS")</script>'
                }

                if details["method"] == "post":
                    res = requests.post(url, data=data)
                elif details["method"] == "get":
                    res = requests.get(url, params=data)

                if '<script>alert("XSS")</script>' in res.content.decode():
                    result = {'url': url, 'form_details': details}
                    results.append(result)

    return results

if __name__ == "__main__":
    app.run()
