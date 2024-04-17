import os
from flask import Flask, render_template, jsonify, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'bshdbaskbfjakfabjfioafoahifoa'

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///yourdatabase.db'  # yourdatabase.db is the SQLite database file
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


class CounterLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    Produkt_Kategorie = db.Column(db.String(120), nullable=False)
    Subkategorie = db.Column(db.String(120), nullable=True)
    Anzahl_MA = db.Column(db.Integer, nullable=False)
    Datum = db.Column(db.DateTime, default=datetime.now, nullable=False)
    Counter = db.Column(db.Integer, nullable=False)


class EventReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    Produkt_Kategorie = db.Column(db.String(120), nullable=False)
    Anzahl_MA = db.Column(db.Integer)
    Datum = db.Column(db.DateTime, nullable=False, default=datetime.now)
    Störungsart = db.Column(db.String(120))
    Anlage = db.Column(db.String(120))
    Fehler = db.Column(db.String(120))
    eventType = db.Column(db.String(120))


class SelectionOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(120), nullable=False)
    # Parent Option ID - this will be 'None' for top-level options
    parent_id = db.Column(db.Integer, db.ForeignKey('selection_option.id'), nullable=True)
    # Relationship to get child options (details)
    children = db.relationship('SelectionOption',
                               backref=db.backref('parent', remote_side=[id]),
                               lazy=True,
                               cascade="all, delete-orphan")
    def __repr__(self):
        return '<SelectionOption %r>' % self.label


with app.app_context():
    db.create_all()

counterLabel = ''
counter = 0  # Initialize counter
counterVortexMit = 0
counterVortexOhne = 0


@app.route('/')
def home():
    return render_template('index.html', counter=counter)

@app.route('/vortex')
def vortex():
    return render_template('vortex.html', counter=counter)

@app.route('/vortex/options', methods=['GET', 'POST'])
def manage_options():
    if request.method == 'POST':
        new_option_label = request.form.get('new_option')
        if new_option_label:
            # No parent_id is needed for a parent option
            new_option = SelectionOption(label=new_option_label)
            db.session.add(new_option)
            db.session.commit()
            return redirect(url_for('manage_options'))  # Redirect to clear form/avoid resubmission

    options = SelectionOption.query.filter(SelectionOption.parent_id.is_(None)).all()
    return render_template('vortex-options.html', options=options)


@app.route('/vortex/options/delete/<int:option_id>', methods=['POST'])
def delete_option(option_id):
    option_to_delete = SelectionOption.query.get_or_404(option_id)
    db.session.delete(option_to_delete)
    db.session.commit()
    flash('Option deleted successfully!', 'success')
    return redirect(url_for('manage_options'))


@app.route('/get_counter_vortex_ohne')
def get_counter_vortex_ohne():
    return jsonify({'counterVortexOhne': counterVortexOhne})


@app.route('/add_child_option', methods=['POST'])
def add_child_option():
    if request.method == 'POST':
        data = request.get_json()
        child_label = data.get('child_label')
        parent_id = data.get('parent_id')
        if child_label and parent_id:
            new_child_option = SelectionOption(label=child_label, parent_id=parent_id)
            db.session.add(new_child_option)
            db.session.commit()
            # Return the ID and label of the newly created child option
            return jsonify({'success': True, 'id': new_child_option.id, 'child_label': child_label})
        else:
            return jsonify({'success': False, 'error': 'Missing data'}), 400


@app.route('/vortex/options/delete_child/<int:child_id>', methods=['POST'])
def delete_child_option(child_id):
    child_option_to_delete = SelectionOption.query.get_or_404(child_id)
    db.session.delete(child_option_to_delete)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Child option deleted successfully.'})


@app.route('/get_selection_options', methods=['GET'])
def get_selection_options():
    # Filter to only include options that have no parent_id (i.e., parent options)
    parent_options = SelectionOption.query.filter_by(parent_id=None).all()
    options_data = [{'id': option.id, 'label': option.label} for option in parent_options]
    return jsonify(options_data)

@app.route('/get_child_selection_options/<int:option_id>', methods=['GET'])
def get_child_selection_options(option_id):
    child_option = SelectionOption.query.get_or_404(option_id)
    details = child_option.children
    details_data = [{'id': detail.id, 'label': detail.label} for detail in details]
    return jsonify(details_data)


# Global variable to keep track of the last update time
last_update_time = None
elapsed_time = 0
productivity_rate = 10  # ST_Soll / Zeit_Soll, import from Excel Produktionsplanung!!!
deltaST = 0


@app.route('/update_counter', methods=['POST'])
def update_counter():
    global counterVortexOhne, counterVortexMit, last_update_time, elapsed_time, productivity_rate, deltaST
    data = request.json
    action = data.get('action')
    material = data.get('material', 'Unknown Material')
    subcategory = data.get('subcategory', 'N/A')
    employeeCount = data.get('employeeCount', 1)  # Default to 1 if not provided
    current_time = datetime.now()
    if last_update_time:
        # Calculate the elapsed time in hours
        elapsed_time += round((current_time - last_update_time).total_seconds() / 60, 3)
        # elapsed_time = round(elapsed_time, 2)

    # Update the last update time to the current time
    last_update_time = current_time

    if action == 'increase':
        if subcategory == 'Mit TF':
            counterVortexMit += 1
            deltaST = round(counterVortexMit - productivity_rate * elapsed_time, 3)
        elif subcategory == 'Ohne TF':
            counterVortexOhne += 1
            deltaST = round(counterVortexOhne - productivity_rate * elapsed_time, 3)
    elif action == 'decrease':
        if subcategory == 'Mit TF' and counterVortexMit > 0:
            counterVortexMit -= 1
        elif subcategory == 'Ohne TF' and counterVortexOhne > 0:
            counterVortexOhne -= 1

    # Log this update to the database
    new_log = CounterLog(Produkt_Kategorie=material, Subkategorie=subcategory,
                         Anzahl_MA=employeeCount, Datum=current_time,
                         Counter=counterVortexMit if subcategory == 'Mit TF' else counterVortexOhne)
    db.session.add(new_log)
    db.session.commit()

    maxCounterValue = 100  # Example value, adjust as needed
    return jsonify(counterVortexOhne=counterVortexOhne, counterVortexMit=counterVortexMit, maxCounterValue=maxCounterValue, deltaST=deltaST)


@app.route('/counter_logs', methods=['GET'])
def get_counter_logs():
    logs = CounterLog.query.all()
    return jsonify([{
        'id': log.id,
        'Datum': log.Datum.isoformat(),
        'Produkt_Kategorie': log.Produkt_Kategorie,
        'Subkategorie': log.Subkategorie,
        'Anzahl_MA': log.AnzahlMA,
        'Counter': log.Counter
    } for log in logs])


@app.route('/report_event', methods=['POST'])
def report_event():
    data = request.json
    # Check if we are updating an existing event
    if 'event_id' in data:
        event_id = data['event_id']
        event = db.session.get(EventReport, event_id)  # Use db.session.get() for SQLAlchemy 2.0 compatibility
        if not event:
            return jsonify({"status": "error", "error": "Event not found"}), 404

        # If eventType is different, add a new entry instead of updating
        if 'eventType' in data and event.eventType != data['eventType']:
            # Add new event with different eventType
            new_event = EventReport(Produkt_Kategorie=event.Produkt_Kategorie, Anzahl_MA=event.Anzahl_MA,
                                    Datum=datetime.now(), Störungsart=data.get('Störungsart', event.Störungsart),
                                    Anlage=data.get('Anlage', event.Anlage), Fehler=data.get('Fehler', event.Fehler),
                                    eventType=data['eventType'])
            db.session.add(new_event)
        else:
            # Update existing event (excluding eventType)
            if 'Störungsart' in data:
                event.Störungsart = data['Störungsart']
            if 'Anlage' in data:
                event.Anlage = data['Anlage']
            if 'Fehler' in data:
                event.Fehler = data['Fehler']
    else:
        # If no event_id is provided, always create a new entry
        new_event = EventReport(Produkt_Kategorie=data.get('material', ''), Anzahl_MA=data.get('employeeCount', 0),
                                Datum=datetime.now(), Störungsart=data.get('Störungsart', ''),
                                Anlage=data.get('Anlage', ''), Fehler=data.get('Fehler', ''),
                                eventType=data.get('eventType', ''))
        db.session.add(new_event)

    db.session.commit()
    return jsonify({"status": "success", "event_id": new_event.id if 'new_event' in locals() else event_id}), 200


@app.route('/report_pause_event', methods=['POST'])
def report_pause_event():
    data = request.json
    # Assuming eventType is the only required data for this route
    if 'eventType' not in data:
        return jsonify({'success': False, 'error': 'Missing eventType'}), 400

    eventType = data['eventType']

    # Create a new event entry with the eventType
    new_event = EventReport(
        Produkt_Kategorie=data['material'],  # Assuming these can be empty or set to some default value
        Anzahl_MA=data['employeeCount'],  # Assuming a default value
        Datum=datetime.now(),
        Störungsart='Mitarbeiter Pause',  # Assuming default or empty since it might not be applicable
        Anlage='',  # Assuming default or empty
        eventType=eventType
    )
    db.session.add(new_event)
    db.session.commit()

    return jsonify({"status": "success", "event_id": new_event.id}), 200


if __name__ == '__main__':
    app.run(port=5000)

